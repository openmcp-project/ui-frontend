import { useCallback, useEffect, useRef, useState } from 'react';
import { parseDocument } from 'yaml';
import * as monaco from 'monaco-editor';

export interface YamlValidity {
  parseOk: boolean;
  schemaErrorCount: number;
  schemaStale?: boolean;
}

export function useYamlValidity(editorContent: string, modelUri: monaco.Uri | null): YamlValidity {
  const [schemaErrorCount, setSchemaErrorCount] = useState(0);
  const [schemaStale, setSchemaStale] = useState(false);
  const schemaErrorCountRef = useRef(schemaErrorCount);

  const recomputeSchemaErrors = useCallback(() => {
    if (!modelUri) return;
    const markers = monaco.editor.getModelMarkers({ resource: modelUri });
    const errors = markers.filter((m) => m.severity === monaco.MarkerSeverity.Error);
    if (errors.length !== schemaErrorCountRef.current) {
      schemaErrorCountRef.current = errors.length;
      setSchemaErrorCount(errors.length);
    }
  }, [modelUri]);

  // Listen for marker changes on the model.
  useEffect(() => {
    if (!modelUri) return;
    const disposable = monaco.editor.onDidChangeMarkers((uris) => {
      if (uris.some((u) => u.toString() === modelUri.toString())) {
        recomputeSchemaErrors();
      }
    });
    return () => disposable.dispose();
  }, [modelUri, recomputeSchemaErrors]);

  // Clear the stale flag a short while after edits stop.
  useEffect(() => {
    const timer = setTimeout(() => setSchemaStale(false), 800);
    return () => clearTimeout(timer);
  }, [editorContent]);

  // Mark content as stale when it changes (called by the editor onChange handler).
  // The parent is responsible for passing updated editorContent.

  // Compute parse validity.
  let parseOk = true;
  try {
    const doc = parseDocument(editorContent);
    parseOk = !doc.errors || doc.errors.length === 0;
  } catch {
    parseOk = false;
  }

  return { parseOk, schemaErrorCount, schemaStale };
}

import { Editor } from '@monaco-editor/react';
import { Button, Panel, Toolbar } from '@ui5/webcomponents-react';
import * as monaco from 'monaco-editor';
import type { JSONSchema } from 'monaco-yaml';
import { configureMonacoYaml } from 'monaco-yaml';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseDocument } from 'yaml';
import { useTheme } from '../../hooks/useTheme';
import { GITHUB_DARK_DEFAULT, GITHUB_LIGHT_DEFAULT } from '../../lib/monaco.ts';
import styles from './YamlEditor.module.css';

import type { JSONSchema4 } from 'json-schema';

export type YamlEditorProps = Omit<ComponentProps<typeof Editor>, 'language'> & {
  isEdit?: boolean;
  onApply?: (parsed: unknown, yaml: string) => void;
  schema?: JSONSchema4;
};

// How many characters into a value before we truncate.
const TRUNCATE_AT = 30;

// Injected-text marker stored in attachedData so we can identify clicks.
const INJECTED_MORE = 'yaml-value-more';
const INJECTED_LESS = 'yaml-value-less';

// Fixed (non-hashed) class names applied by Monaco — must match :global selectors in the CSS module.
const CLS_TAIL = 'yaml-value-tail';
const CLS_MORE = 'yaml-inject-more';
const CLS_LESS = 'yaml-inject-less';

interface TruncationData {
  lineNumber: number;
  marker: typeof INJECTED_MORE | typeof INJECTED_LESS;
}

function applyTruncationDecorations(editor: monaco.editor.IStandaloneCodeEditor, expandedLines: Set<number>): string[] {
  const model = editor.getModel();
  if (!model) return [];

  const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
  const lineCount = model.getLineCount();

  for (let lineNum = 1; lineNum <= lineCount; lineNum++) {
    const line = model.getLineContent(lineNum);

    // Match either:
    //   "key: value"  — inline scalar
    //   "  'value'"   — indented continuation / block scalar (quoted or plain, no key)
    const inlineMatch = line.match(/^(\s*[\w\-./]+\s*:\s+)(.*)/);
    const continuationMatch = !inlineMatch ? line.match(/^(\s+)(['"]?.+['"]?)$/) : null;
    const match = inlineMatch ?? continuationMatch;
    if (!match) continue;

    const valueStart = match[1].length + 1; // 1-based column where value begins
    const value = match[2];

    if (value.length <= TRUNCATE_AT) continue;

    const isExpanded = expandedLines.has(lineNum);
    const tailStartCol = valueStart + TRUNCATE_AT;
    const tailEndCol = valueStart + value.length;

    if (isExpanded) {
      // Show full value, inject "less" button after
      newDecorations.push({
        range: new monaco.Range(lineNum, tailEndCol, lineNum, tailEndCol),
        options: {
          after: {
            content: '  ↑ less',
            inlineClassName: CLS_LESS,
            attachedData: { lineNumber: lineNum, marker: INJECTED_LESS } satisfies TruncationData,
            cursorStops: monaco.editor.InjectedTextCursorStops.None,
          },
        },
      });
    } else {
      // Hide the tail, inject "more" button
      newDecorations.push({
        range: new monaco.Range(lineNum, tailStartCol, lineNum, tailEndCol),
        options: {
          inlineClassName: CLS_TAIL,
          after: {
            content: '  … more',
            inlineClassName: CLS_MORE,
            attachedData: { lineNumber: lineNum, marker: INJECTED_MORE } satisfies TruncationData,
            cursorStops: monaco.editor.InjectedTextCursorStops.None,
          },
        },
      });
    }
  }

  return editor.deltaDecorations([], newDecorations);
}

export const YamlEditor = (props: YamlEditorProps) => {
  const { isDarkTheme } = useTheme();
  const { t } = useTranslation();
  const {
    theme,
    options,
    value,
    defaultValue,
    onChange,
    isEdit = false,
    onApply,
    onMount: parentOnMount,
    schema,
    ...rest
  } = props;
  const computedTheme = theme ?? (isDarkTheme ? GITHUB_DARK_DEFAULT : GITHUB_LIGHT_DEFAULT);

  const [editorContent, setEditorContent] = useState<string>(value?.toString() ?? defaultValue?.toString() ?? '');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [applyAttempted, setApplyAttempted] = useState(false);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const expandedLinesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const { dispose } = configureMonacoYaml(monaco, {
      isKubernetes: true,
      enableSchemaRequest: true,
      hover: true,
      completion: true,
      validate: true,
      format: { enable: true },
      schemas: [
        {
          schema: schema as JSONSchema,
          fileMatch: ['*'],
          uri: 'https://kubernetesjsonschema.dev/master-standalone/all.json',
        },
      ],
    });
    return () => dispose();
  }, [schema]);

  const refreshDecorations = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || isEdit) return;
    // Remove previous decorations before applying new ones
    editor.deltaDecorations(decorationIdsRef.current, []);
    decorationIdsRef.current = applyTruncationDecorations(editor, expandedLinesRef.current);
  }, [isEdit]);

  const enforcedOptions: monaco.editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      ...(options as monaco.editor.IStandaloneEditorConstructionOptions),
      readOnly: isEdit ? false : (options?.readOnly ?? true),
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      wordWrap: isEdit ? 'on' : 'off',
      folding: true,
      foldingStrategy: 'indentation',
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
      suggestOnTriggerCharacters: true,
      glyphMargin: true,
      formatOnPaste: true,
      formatOnType: true,
      fontSize: 13,
      lineHeight: 20,
      contextmenu: false,
    }),
    [options, isEdit],
  );

  const handleEditorChange = useCallback(
    (val: string | undefined, event?: monaco.editor.IModelContentChangedEvent) => {
      if (isEdit) {
        setEditorContent(val ?? '');
      }
      if (event) {
        onChange?.(val ?? '', event);
      }
    },
    [isEdit, onChange],
  );

  const handleApply = useCallback(() => {
    const run = async () => {
      setApplyAttempted(true);
      try {
        const doc = parseDocument(editorContent);
        if (doc.errors && doc.errors.length) {
          setValidationErrors(doc.errors.map((e) => e.message));
          return;
        }
        setValidationErrors([]);
        const jsObj = doc.toJS();
        if (onApply) {
          await onApply(jsObj, editorContent);
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setValidationErrors([e.message]);
        } else {
          setValidationErrors(['Unknown YAML parse error']);
        }
      }
    };
    run();
  }, [editorContent, onApply]);

  const handleMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      if (!isEdit) {
        refreshDecorations();

        editor.onMouseDown((e) => {
          if (e.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) return;
          // attachedData lives on detail.injectedText.options — not in the public types
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = (e.target.detail as any)?.injectedText?.options?.attachedData as TruncationData | undefined;
          if (!data) return;

          const { lineNumber, marker } = data;
          if (marker === INJECTED_MORE) {
            expandedLinesRef.current.add(lineNumber);
          } else {
            expandedLinesRef.current.delete(lineNumber);
          }
          refreshDecorations();
        });
      }

      parentOnMount?.(editor, monaco);
    },
    [isEdit, refreshDecorations, parentOnMount],
  );

  // Re-apply decorations whenever the YAML value changes (e.g. "show only important" toggle)
  useEffect(() => {
    if (!isEdit) {
      expandedLinesRef.current = new Set();
      refreshDecorations();
    }
  }, [value, isEdit, refreshDecorations]);

  const showValidationErrors = isEdit && applyAttempted && validationErrors.length > 0;

  return (
    <div className={styles.container}>
      {isEdit && (
        <Toolbar design="Solid">
          <Button
            className={styles.applyButton}
            design="Emphasized"
            data-testid="yaml-apply-button"
            onClick={handleApply}
          >
            {t('buttons.applyChanges')}
          </Button>
        </Toolbar>
      )}
      <div className={styles.editorWrapper}>
        <Editor
          {...rest}
          value={isEdit ? editorContent : value}
          theme={computedTheme}
          options={enforcedOptions}
          height="100%"
          language="yaml"
          onChange={handleEditorChange}
          onMount={handleMount}
        />
      </div>
      {showValidationErrors && (
        <Panel headerText={t('yaml.validationErrors')} className={styles.validationPanel}>
          <ul className={styles.validationList}>
            {validationErrors.map((err, idx) => (
              <li key={idx} className={styles.validationListItem}>
                {err}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
};

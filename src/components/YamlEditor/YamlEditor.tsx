import { Editor } from '@monaco-editor/react';
import type { ComponentProps } from 'react';
import { Button, Panel, Toolbar } from '@ui5/webcomponents-react';
import { parseDocument } from 'yaml';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { GITHUB_DARK_DEFAULT, GITHUB_LIGHT_DEFAULT } from '../../lib/monaco.ts';
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';
import type { JSONSchema } from 'monaco-yaml';
import styles from './YamlEditor.module.css';

import type { JSONSchema4 } from 'json-schema';

export type YamlEditorProps = Omit<ComponentProps<typeof Editor>, 'language'> & {
  isEdit?: boolean;
  onApply?: (parsed: unknown, yaml: string) => void;
  schema?: JSONSchema4;
};

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

  // Ref to the wrapper to scope global key handlers
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.Cypress) return;

    const { dispose } = configureMonacoYaml(monaco, {
      isKubernetes: true,
      enableSchemaRequest: true,
      hover: true,
      completion: true,
      validate: true,
      format: true,
      schemas: [
        {
          schema: schema as JSONSchema,
          fileMatch: ['*'],
          uri: 'http://kubernetesjsonschema.dev/master-standalone/all.json',
        },
      ],
    });
    return () => dispose();
  }, [schema]);

  const enforcedOptions: monaco.editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      ...(options as monaco.editor.IStandaloneEditorConstructionOptions),
      readOnly: isEdit ? false : (options?.readOnly ?? true),
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      wordWrap: 'on',
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
      <div ref={wrapperRef} className={styles.editorWrapper}>
        <Editor
          {...rest}
          value={isEdit ? editorContent : value}
          theme={computedTheme}
          options={enforcedOptions}
          height="100%"
          language="yaml"
          onChange={handleEditorChange}
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

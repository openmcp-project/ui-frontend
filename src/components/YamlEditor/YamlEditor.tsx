import { Editor } from '@monaco-editor/react';
import type { ComponentProps } from 'react';
import { Button, Panel, Toolbar, ToolbarSpacer, Title } from '@ui5/webcomponents-react';
import { parseDocument } from 'yaml';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { GITHUB_DARK_DEFAULT, GITHUB_LIGHT_DEFAULT } from '../../lib/monaco.ts';
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor';

// Reuse all props from the underlying Monaco Editor component, except language (we force YAML)
export type YamlEditorProps = Omit<ComponentProps<typeof Editor>, 'language'> & {
  // When true, editor becomes editable and an Apply changes button & validation appear
  isEdit?: boolean;
};

// Simple wrapper that forwards all props to Monaco Editor, enhanced with edit/apply capability
export const YamlEditor = (props: YamlEditorProps) => {
  const { isDarkTheme } = useTheme();
  const { t } = useTranslation();
  const { theme, options, value, defaultValue, onChange, isEdit = false, ...rest } = props;
  const computedTheme = theme ?? (isDarkTheme ? GITHUB_DARK_DEFAULT : GITHUB_LIGHT_DEFAULT);

  // Maintain internal state only in edit mode; otherwise rely on provided value (viewer mode)
  const [code, setCode] = useState<string>(value?.toString() ?? defaultValue?.toString() ?? '');
  const [errors, setErrors] = useState<string[]>([]);
  const [attemptedApply, setAttemptedApply] = useState(false);

  // Keep internal state in sync when value prop changes in non-edit mode
  useEffect(() => {
    if (typeof value !== 'undefined') {
      setCode(value.toString());
    }
  }, [value]);

  const enforcedOptions = useMemo(
    () => ({
      ...options,
      readOnly: isEdit ? false : (options?.readOnly ?? true),
      minimap: { enabled: false },
      isKubernetes: true,
      wordWrap: 'on',
      scrollBeyondLastLine: false,
    }),
    [options, isEdit],
  );

  const handleInternalChange = useCallback(
    (val: string | undefined) => {
      if (isEdit) {
        setCode(val ?? '');
      }
      onChange?.(val ?? '', undefined as unknown as monaco.editor.IModelContentChangedEvent);
    },
    [isEdit, onChange],
  );

  const handleApply = useCallback(() => {
    setAttemptedApply(true);
    try {
      const doc = parseDocument(code);
      if (doc.errors && doc.errors.length) {
        setErrors(doc.errors.map((e) => e.message));
        return;
      }
      setErrors([]);
      const jsObj = doc.toJS();

      console.log('Parsed YAML object:', jsObj);
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'message' in e) {
        // @ts-expect-error narrowing message
        setErrors([String(e.message)]);
      } else {
        setErrors(['Unknown YAML parse error']);
      }
    }
  }, [code]);

  const showErrors = isEdit && attemptedApply && errors.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {isEdit && (
        <Toolbar design="Solid">
          <Title>{t('yaml.editorTitle')}</Title>
          <ToolbarSpacer />
          <Button design="Emphasized" onClick={handleApply}>
            {t('buttons.applyChanges', 'Apply changes')}
          </Button>
        </Toolbar>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          {...rest}
          value={isEdit ? code : value}
          theme={computedTheme}
          options={enforcedOptions}
          height="100%"
          language="yaml"
          onChange={handleInternalChange}
        />
      </div>
      {showErrors && (
        <Panel headerText="Output" style={{ marginTop: '0.5rem' }}>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {errors.map((err, idx) => (
              <li key={idx} style={{ listStyle: 'disc', fontFamily: 'monospace' }}>
                {err}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
};

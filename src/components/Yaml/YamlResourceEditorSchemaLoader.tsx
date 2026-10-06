import { FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageStrip } from '@ui5/webcomponents-react';
import { YamlViewer, YamlViewerProps } from './YamlViewer.tsx';
import Loading from '../Shared/Loading.tsx';
import { useCustomResourceDefinitionQuery } from '../../hooks/useCustomResourceDefinitionQuery.ts';
import { YamlEditor } from '../YamlEditor/YamlEditor.tsx';

interface YamlViewerSchemaLoaderProps extends YamlViewerProps {
  apiVersion: string;
  apiGroupName: string;
  kind?: string;
  /** When true, renders the editor immediately and shows a loading/error strip instead of a spinner. */
  nonBlocking?: boolean;
  onSchemaStatusChange?: (status: 'loading' | 'loaded' | 'failed') => void;
}

export const YamlResourceEditorSchemaLoader: FC<YamlViewerSchemaLoaderProps> = ({
  yamlString,
  filename,
  isEdit = false,
  onApply,
  onChange,
  apiGroupName,
  apiVersion,
  kind,
  nonBlocking = false,
  onSchemaStatusChange,
}) => {
  const { t } = useTranslation();
  const { schema, isLoading, error } = useCustomResourceDefinitionQuery({
    kind,
    apiGroupName,
    apiVersion,
  });

  useEffect(() => {
    if (!kind) return;
    if (isLoading) {
      onSchemaStatusChange?.('loading');
    } else if (error) {
      onSchemaStatusChange?.('failed');
    } else {
      onSchemaStatusChange?.('loaded');
    }
  }, [kind, isLoading, error, onSchemaStatusChange]);

  if (!nonBlocking && kind && isLoading) {
    return <Loading />;
  }

  return (
    <>
      {nonBlocking && kind && isLoading && (
        <MessageStrip design="Information" hideCloseButton>
          {t('yamlApply.schemaLoading', { kind })}
        </MessageStrip>
      )}
      {nonBlocking && kind && error && (
        <MessageStrip design="Critical" hideCloseButton>
          {t('yamlApply.schemaUnavailable')}
        </MessageStrip>
      )}
      <YamlViewer
        schema={schema}
        yamlString={yamlString}
        filename={filename}
        isEdit={isEdit}
        onApply={onApply}
        onChange={onChange}
      />
    </>
  );
};

/** Props for a standalone editable schema-aware editor used inside dialogs. */
export interface SchemaEditorProps {
  apiVersion: string;
  apiGroupName: string;
  kind?: string;
  /** Initial YAML content — editor is uncontrolled once mounted; changes flow via onChange. */
  yamlString: string;
  filename: string;
  onChange?: (value: string) => void;
}

/**
 * Editable Monaco editor with live CRD schema loading.
 * Renders without a toolbar — use externally controlled apply button.
 * Shows a slim MessageStrip below while the schema is loading.
 * Uses options.readOnly=false override so editing works without the built-in toolbar.
 */
export const SchemaAwareEditor: FC<SchemaEditorProps> = ({
  apiVersion,
  apiGroupName,
  kind,
  yamlString,
  filename,
  onChange,
}) => {
  const { t } = useTranslation();
  const { schema, isLoading, error } = useCustomResourceDefinitionQuery({
    kind,
    apiGroupName,
    apiVersion,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        {/* isEdit=false suppresses toolbar; options.readOnly=false overrides the default lock */}
        <YamlEditor
          value={yamlString}
          path={`${filename}.yaml`}
          isEdit={false}
          options={{ readOnly: false }}
          schema={schema}
          onChange={(val) => onChange?.(val ?? '')}
        />
      </div>
      {kind && isLoading && (
        <MessageStrip design="Information" hideCloseButton style={{ flexShrink: 0 }}>
          {t('yamlApply.schemaLoading', { kind })}
        </MessageStrip>
      )}
      {kind && error && (
        <MessageStrip design="Critical" hideCloseButton style={{ flexShrink: 0 }}>
          {t('yamlApply.schemaUnavailable')}
        </MessageStrip>
      )}
    </div>
  );
};

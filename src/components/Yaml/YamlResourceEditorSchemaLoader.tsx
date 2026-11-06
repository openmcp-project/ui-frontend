import { FC } from 'react';

import { YamlViewer, YamlViewerProps } from './YamlViewer.tsx';
import Loading from '../Shared/Loading.tsx';
import { useCustomResourceDefinitionQuery } from '../../hooks/useCustomResourceDefinitionQuery.ts';
import { useTranslation } from 'react-i18next';

interface YamlViewerSchemaLoaderProps extends YamlViewerProps {
  apiVersion: string;
  apiGroupName: string;

  kind?: string;
}

export const YamlResourceEditorSchemaLoader: FC<YamlViewerSchemaLoaderProps> = ({
  yamlString,
  filename,
  isEdit = false,
  onApply,
  apiGroupName,
  apiVersion,
  kind,
  height,
  hideToolbar,
  onValidityChange,
  onContentChange,
}) => {
  const { t } = useTranslation();
  const { schema, isResolvingKind, isLoadingSchema } = useCustomResourceDefinitionQuery({
    kind,
    apiGroupName,
    apiVersion,
  });

  if (kind && isResolvingKind) {
    return (
      <Loading title={t('schemaLoader.resolvingTitle')} subtitle={t('schemaLoader.resolvingSubtitle', { kind })} />
    );
  }

  if (kind && isLoadingSchema) {
    return <Loading title={t('schemaLoader.schemaTitle')} subtitle={t('schemaLoader.schemaSubtitle', { kind })} />;
  }

  return (
    <YamlViewer
      schema={schema}
      yamlString={yamlString}
      filename={filename}
      isEdit={isEdit}
      height={height}
      hideToolbar={hideToolbar}
      onApply={onApply}
      onValidityChange={onValidityChange}
      onContentChange={onContentChange}
    />
  );
};

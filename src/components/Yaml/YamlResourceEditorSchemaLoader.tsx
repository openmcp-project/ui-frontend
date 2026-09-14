import { FC } from 'react';

import { YamlViewer, YamlViewerProps } from './YamlViewer.tsx';
import Loading from '../Shared/Loading.tsx';
import { useCustomResourceDefinitionQuery } from '../../hooks/useCustomResourceDefinitionQuery.ts';

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
}) => {
  const { schema, isLoading } = useCustomResourceDefinitionQuery({
    kind,
    apiGroupName,
    apiVersion,
  });

  if (kind && isLoading) {
    return <Loading />;
  }

  return <YamlViewer schema={schema} yamlString={yamlString} filename={filename} isEdit={isEdit} onApply={onApply} />;
};

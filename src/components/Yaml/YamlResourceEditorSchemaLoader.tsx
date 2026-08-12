import { FC, useEffect, useRef } from 'react';

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
  const hasShownErrorRef = useRef(false);

  const { schema, isLoading, error } = useCustomResourceDefinitionQuery({
    kind,
    apiGroupName,
    apiVersion,
  });

  useEffect(() => {
    if (!hasShownErrorRef.current && error) {
      console.warn('Cannot load schema for this resource', { apiGroupName, apiVersion, kind, error });
      hasShownErrorRef.current = true;
    }
  }, [error, apiGroupName, apiVersion, kind]);

  if (kind && isLoading) {
    return <Loading />;
  }

  return <YamlViewer schema={schema} yamlString={yamlString} filename={filename} isEdit={isEdit} onApply={onApply} />;
};

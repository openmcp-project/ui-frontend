import { FC, useMemo } from 'react';

import { YamlViewer, YamlViewerProps } from './YamlViewer.tsx';
import { useApiResource } from '../../lib/api/useApiResource.ts';
import Loading from '../Shared/Loading.tsx';
import { CustomResourceDefinition } from '../../types/customResourceDefinition.ts';
import openapiSchemaToJsonSchema from '@openapi-contrib/openapi-schema-to-json-schema';

import { ApiConfig } from '../../lib/api/types/apiConfig.ts';
import { getCustomResourceDefinitionPluralName } from '../../utils/getPluralName.ts';

interface YamlViewerSchemaLoaderProps extends YamlViewerProps {
  apiVersion: string;
  apiGroupName: string;
  apiConfig?: ApiConfig;
  kind?: string;
}

export const YamlViewerSchemaLoader: FC<YamlViewerSchemaLoaderProps> = ({
  yamlString,
  filename,
  isEdit = false,
  onApply,
  apiGroupName,
  apiVersion,
  apiConfig,
  kind,
}) => {
  const customResourceDefinitionName = getCustomResourceDefinitionPluralName(kind);
  const { data: crdData, isLoading } = useApiResource<CustomResourceDefinition>(
    {
      path: `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${customResourceDefinitionName}.${apiGroupName}`,
    },
    undefined,
    apiConfig?.mcpConfig,
    !customResourceDefinitionName,
  );

  const schema =
    crdData?.spec.versions?.find(({ name }) => name === apiVersion)?.schema.openAPIV3Schema ??
    crdData?.spec.versions?.[0].schema.openAPIV3Schema;
  const editorInstanceSchema = useMemo(() => (schema ? openapiSchemaToJsonSchema(schema) : undefined), [schema]);

  if (customResourceDefinitionName && isLoading) {
    return <Loading />;
  }
  return (
    <YamlViewer
      schema={editorInstanceSchema}
      yamlString={yamlString}
      filename={filename}
      isEdit={isEdit}
      onApply={onApply}
    />
  );
};

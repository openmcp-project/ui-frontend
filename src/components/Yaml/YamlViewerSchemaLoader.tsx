import { FC, useMemo } from 'react';

import { YamlViewer, YamlViewerProps } from './YamlViewer.tsx';
import { useApiResource } from '../../lib/api/useApiResource.ts';
import Loading from '../Shared/Loading.tsx';
import { CustomResourceDefinition } from '../../types/customResourceDefinition.ts';
import openapiSchemaToJsonSchema from '@openapi-contrib/openapi-schema-to-json-schema';

import { ApiConfig } from '../../lib/api/types/apiConfig.ts';

interface YamlViewerSchemaLoaderProps extends YamlViewerProps {
  customResourceDefinitionName?: CustomResourceDefinitionName;
  apiVersion: string;
  apiGroupName: string;
  apiConfig?: ApiConfig;
}

export type CustomResourceDefinitionName =
  | 'workspaces'
  | 'projects'
  | 'managedcontrolplanes'
  | 'providerconfigs'
  | 'providers'
  | 'cloudmanagements'
  | 'gitrepositories'
  | 'kustomizations';
export const YamlViewerSchemaLoader: FC<YamlViewerSchemaLoaderProps> = ({
  yamlString,
  filename,
  isEdit = false,
  onApply,
  customResourceDefinitionName,
  apiGroupName,
  apiVersion,
  apiConfig,
}) => {
  // Load custom resource definition for the resource
  const { data: crdData, isLoading } = useApiResource<CustomResourceDefinition>(
    {
      path: `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${customResourceDefinitionName}.${apiGroupName}`,
    },
    undefined,
    false,
    false,
    apiConfig,
  );
  console.log('apiConfig schema file');
  console.log(apiConfig);
  console.log('crdData');
  console.log(crdData);
  const schema =
    crdData?.spec.versions?.find(({ name }) => name === apiVersion)?.schema.openAPIV3Schema ??
    crdData?.spec.versions?.[0].schema.openAPIV3Schema;
  const editorInstanceSchema = useMemo(() => (schema ? openapiSchemaToJsonSchema(schema) : undefined), [schema]);
  console.log('Custom Resource Definitions:', crdData);
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

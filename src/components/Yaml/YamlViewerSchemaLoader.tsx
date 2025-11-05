import { FC, useMemo } from 'react';

import { YamlViewer, YamlViewerProps } from './YamlViewer.tsx';
import { useApiResource } from '../../lib/api/useApiResource.ts';
import Loading from '../Shared/Loading.tsx';
import { CustomResourceDefinition } from '../../types/customResourceDefinition.ts';
import openapiSchemaToJsonSchema from '@openapi-contrib/openapi-schema-to-json-schema';

interface YamlViewerSchemaLoaderProps extends YamlViewerProps {
  customResourceDefinitionName?: CustomResourceDefinitionName;
}

export type CustomResourceDefinitionName =
  | 'workspaces.core.openmcp.cloud'
  | 'projects.core.openmcp.cloud'
  | 'managedcontrolplanes.core.openmcp.cloud';
export const YamlViewerSchemaLoader: FC<YamlViewerSchemaLoaderProps> = ({
  yamlString,
  filename,
  isEdit = false,
  onApply,
  customResourceDefinitionName,
}) => {
  // Load custom resource definition for the resource
  const { data: crdData, isLoading } = useApiResource<CustomResourceDefinition>(
    {
      path: `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${customResourceDefinitionName}`,
    },
    undefined,
    true,
    !customResourceDefinitionName,
  );
  const schema = crdData?.spec.versions?.[0].schema.openAPIV3Schema;
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

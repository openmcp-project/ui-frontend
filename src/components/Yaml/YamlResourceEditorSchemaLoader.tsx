import { FC, useMemo, useEffect, useRef } from 'react';

import { YamlViewer, YamlViewerProps } from './YamlViewer.tsx';
import { useApiResource } from '../../lib/api/useApiResource.ts';
import Loading from '../Shared/Loading.tsx';
import { CustomResourceDefinition } from '../../types/customResourceDefinition.ts';
import openapiSchemaToJsonSchema from '@openapi-contrib/openapi-schema-to-json-schema';

import { getCustomResourceDefinitionPluralName } from '../../utils/getPluralName.ts';
import { useToast } from '../../context/ToastContext.tsx';
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
}) => {
  const customResourceDefinitionName = getCustomResourceDefinitionPluralName(kind);
  const { show } = useToast();
  const hasShownErrorRef = useRef(false);

  const {
    data: crdData,
    isLoading,
    error,
  } = useApiResource<CustomResourceDefinition>(
    {
      path: `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${customResourceDefinitionName}.${apiGroupName}`,
    },
    undefined,
    undefined,
    !customResourceDefinitionName,
  );

  const { t } = useTranslation();

  useEffect(() => {
    if (!hasShownErrorRef.current && error) {
      show(t('errors.cannotLoadSchema'));
      hasShownErrorRef.current = true;
    }
  }, [error, show, t]);

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

import { FC, useEffect, useRef } from 'react';

import { YamlViewer, YamlViewerProps } from './YamlViewer.tsx';
import Loading from '../Shared/Loading.tsx';
import { useCustomResourceDefinitionQuery } from '../../hooks/useCustomResourceDefinitionQuery.ts';
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
  const hasShownErrorRef = useRef(false);

  const { schema, isLoading, error } = useCustomResourceDefinitionQuery({
    kind,
    apiGroupName,
    apiVersion,
  });

  const { show } = useToast();

  const { t } = useTranslation();

  useEffect(() => {
    if (!hasShownErrorRef.current && error) {
      show(t('errors.cannotLoadSchema'));
      hasShownErrorRef.current = true;
    }
  }, [error, show, t]);

  if (kind && isLoading) {
    return <Loading />;
  }

  return <YamlViewer schema={schema} yamlString={yamlString} filename={filename} isEdit={isEdit} onApply={onApply} />;
};

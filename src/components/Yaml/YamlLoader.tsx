import { ResourceProps } from './YamlViewButton.tsx';
import { FC } from 'react';
import Loading from '@components/Shared/Loading.tsx';
import useResource from '@lib/api/useApiResource.ts';
import { ResourceObject } from '@lib/api/types/crate/resourceObject.ts';
import { stringify } from 'yaml';
import YamlViewer from '@components/Yaml/YamlViewer.tsx';
import IllustratedError from '@components/Shared/IllustratedError.tsx';
import { useTranslation } from 'react-i18next';

export const YamlLoader: FC<ResourceProps> = ({
  workspaceName,
  resourceType,
  resourceName,
}) => {
  const { isLoading, data, error } = useResource(
    ResourceObject(workspaceName ?? '', resourceType, resourceName),
  );
  const { t } = useTranslation();
  if (isLoading) return <Loading />;
  if (error) {
    return <IllustratedError error={t('common.cannotLoadData')} />;
  }

  return <YamlViewer yamlString={stringify(data)} />;
};

import { YamlViewButtonProps } from './YamlViewButtonWithLoader.tsx';
import { FC } from 'react';

import { stringify } from 'yaml';

import { useTranslation } from 'react-i18next';
import { ResourceObject } from '../../lib/api/types/crate/resourceObject.ts';
import Loading from '../Shared/Loading.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import YamlViewer from './YamlViewer.tsx';
import useResource from '../../lib/api/useApiResource';
import { removeManagedFieldsProperty, Resource } from '../../utils/removeManagedFieldsProperty.ts';

export const YamlLoader: FC<YamlViewButtonProps> = ({ workspaceName, resourceType, resourceName }) => {
  const { isLoading, data, error } = useResource(
    ResourceObject(workspaceName ?? '', resourceType, resourceName),
    undefined,
    true,
  );
  const { t } = useTranslation();
  if (isLoading) return <Loading />;
  if (error) {
    return <IllustratedError details={t('common.cannotLoadData')} />;
  }

  return (
    <YamlViewer
      yamlString={stringify(removeManagedFieldsProperty(data as Resource))}
      filename={`${workspaceName ? `${workspaceName}_` : ''}${resourceType}_${resourceName}`}
    />
  );
};

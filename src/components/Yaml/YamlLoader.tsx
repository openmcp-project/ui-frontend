import { YamlViewButtonProps } from './YamlViewButtonWithLoader.tsx';
import { FC } from 'react';

import { stringify } from 'yaml';

import { useTranslation } from 'react-i18next';
import { ResourceObject } from '../../lib/api/types/crate/resourceObject.ts';
import Loading from '../Shared/Loading.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import YamlViewer from './YamlViewer.tsx';
import { useApiResource } from '../../lib/api/useApiResource';
import {
  removeManagedFieldsPropertyAndFilterFields,
  Resource,
} from '../../utils/removeManagedFieldsPropertyAndFilterFields.ts';

export const YamlLoader: FC<YamlViewButtonProps> = ({
  workspaceName,
  resourceType,
  resourceName,
  showOnlyImportantYamlProperties,
}) => {
  const { isLoading, data, error } = useApiResource(
    ResourceObject(workspaceName ?? '', resourceType, resourceName),
    undefined,
    true,
  );
  const { t } = useTranslation();
  if (isLoading) return <Loading />;
  if (error) {
    return <IllustratedError details={t('common.cannotLoadData')} />;
  }
  const yamlString = stringify(
    removeManagedFieldsPropertyAndFilterFields(data as Resource, showOnlyImportantYamlProperties),
  );
  console.log(
    'yamlString',
    removeManagedFieldsPropertyAndFilterFields(data as Resource, showOnlyImportantYamlProperties),
  );
  return (
    <YamlViewer
      yamlString={yamlString}
      filename={`${workspaceName ? `${workspaceName}_` : ''}${resourceType}_${resourceName}`}
    />
  );
};

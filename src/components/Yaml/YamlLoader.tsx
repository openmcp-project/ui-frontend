import { YamlViewButtonProps } from './YamlViewButtonWithLoader.tsx';
import { FC, useMemo } from 'react';

import { stringify } from 'yaml';

import { useTranslation } from 'react-i18next';
import { ResourceObject } from '../../lib/api/types/crate/resourceObject.ts';
import Loading from '../Shared/Loading.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import YamlViewer from './YamlViewer.tsx';
import { useApiResource } from '../../lib/api/useApiResource';
import { removeManagedFieldsProperty, Resource } from '../../utils/removeManagedFieldsProperty.ts';

interface YamlLoaderProps extends YamlViewButtonProps {
  showOnlyImportantData?: boolean;
  setShowOnlyImportantData?: (showOnlyImportantData: boolean) => void;
}

export const YamlLoader: FC<YamlLoaderProps> = ({
  workspaceName,
  resourceType,
  resourceName,
  showOnlyImportantData = false,
  setShowOnlyImportantData,
}) => {
  const { isLoading, data, error } = useApiResource(
    ResourceObject(workspaceName ?? '', resourceType, resourceName),
    undefined,
    true,
  );
  const { t } = useTranslation();
  const yamlString = useMemo(() => {
    if (isLoading || error) return '';
    return stringify(removeManagedFieldsProperty(data as Resource, showOnlyImportantData));
  }, [data, error, isLoading, showOnlyImportantData]);

  const yamlStringToCopy = useMemo(() => {
    if (isLoading || error) return '';
    return stringify(removeManagedFieldsProperty(data as Resource, false));
  }, [data, error, isLoading]);
  if (isLoading) return <Loading />;
  if (error) {
    return <IllustratedError details={t('common.cannotLoadData')} />;
  }

  return (
    <YamlViewer
      yamlString={yamlString}
      yamlStringToCopy={yamlStringToCopy}
      filename={`${workspaceName ? `${workspaceName}_` : ''}${resourceType}_${resourceName}`}
      setShowOnlyImportantData={setShowOnlyImportantData}
      showOnlyImportantData={showOnlyImportantData}
    />
  );
};

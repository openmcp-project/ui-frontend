import YamlViewer from './YamlViewer.tsx';
import { ResourceProps } from './YamlViewButton.tsx';
import { FC } from 'react';
import { useManagedControlPlaneYamlQuery } from '@/spaces/onboarding/services/YamlServices/YamlService.ts';
import Loading from '@components/Shared/Loading.tsx';

export const YamlLoader: FC<ResourceProps> = ({
  workspaceName,
  projectName,
  resourceType,
  resourceName,
}) => {
  const { data, loading } = useManagedControlPlaneYamlQuery(
    workspaceName,
    projectName,
  );
  if (loading) return <Loading />;
  // if (!workspaceName || !projectName || !resourceName || resourceType)
  //   return <div />;
  return <YamlViewer yamlString={data} />;
};

import YamlViewer from './YamlViewer.tsx';
import { ResourceProps } from './YamlViewButton.tsx';
import { FC } from 'react';

export const YamlLoader: FC<ResourceProps> = ({
  workspaceName,
  projectName,
  resourceType,
  resourceName,
}) => {
  if (!workspaceName || !projectName || !resourceName || resourceType)
    return <div />;
  return <YamlViewer yamlString={''} />;
};

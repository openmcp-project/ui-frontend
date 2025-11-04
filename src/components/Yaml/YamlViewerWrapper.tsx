import { FC } from 'react';

import { YamlViewer, YamlViewerProps } from './YamlViewer.tsx';

export const YamlViewerWrapper: FC<YamlViewerProps> = ({ yamlString, filename, isEdit = false, onApply }) => {
  return <YamlViewer yamlString={yamlString} filename={filename} isEdit={isEdit} onApply={onApply} />;
};

import { FC } from 'react';

import { YamlDiffEditor } from '../YamlEditor/YamlDiffEditor.tsx';

type YamlDiffProps = {
  originalYaml: string;
  modifiedYaml: string;
};

export const YamlDiff: FC<YamlDiffProps> = ({ originalYaml, modifiedYaml }) => {
  return <YamlDiffEditor original={originalYaml} modified={modifiedYaml} />;
};

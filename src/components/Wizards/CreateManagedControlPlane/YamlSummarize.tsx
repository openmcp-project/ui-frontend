import { FC } from 'react';
import { YamlBlock } from '../../Yaml/YamlBlock.tsx';

type YamlPanelProps = {
  yamlString: string;
  filename: string;
  apiGroupName: string;
  apiVersion: string;
};

const YamlSummarize: FC<YamlPanelProps> = ({ yamlString, filename }) => {
  return <YamlBlock value={yamlString} filename={filename} size="fill" />;
};

export default YamlSummarize;

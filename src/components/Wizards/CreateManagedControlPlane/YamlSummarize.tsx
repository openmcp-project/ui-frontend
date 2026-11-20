import { FC } from 'react';
import { YamlBlock } from '../../Yaml/YamlBlock.tsx';

type YamlPanelProps = {
  yamlString: string;
  filename: string;
  apiGroupName: string;
  apiVersion: string;
};

const YamlSummarize: FC<YamlPanelProps> = ({ yamlString, filename }) => {
  return (
    <div style={{ height: 'calc(100vh - 14rem)' }}>
      <YamlBlock value={yamlString} filename={filename} size="fill" />
    </div>
  );
};

export default YamlSummarize;

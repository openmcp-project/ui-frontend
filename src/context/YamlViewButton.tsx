import { Button, Dialog } from '@ui5/webcomponents-react';
import { FC, useState } from 'react';
import YamlViewer from './YamlViewer.tsx';

type YamlViewProps = {
  content: string;
};

export const YamlViewButton: FC<YamlViewProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} stretch>
        {/*<TextArea value={content} rows={20} />*/}
        <YamlViewer yamlString={content} />
      </Dialog>
      <Button
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Yaml
      </Button>
    </>
  );
};

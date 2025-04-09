import { Button, Dialog, TextArea } from '@ui5/webcomponents-react';
import { FC, useState } from 'react';

type YamlViewProps = {
  content: string;
};

export const YamlView: FC<YamlViewProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} stretch>
        <TextArea value={content} rows={20} />
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

import { Button } from '@ui5/webcomponents-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { YamlEditorDialog } from '../Dialogs/YamlEditorDialog';
import { YamlIcon } from './YamlIcon';

export const YamlEditorButton: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const sampleYaml = `
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.14.2
    ports:
    - containerPort: 80
`;

  return (
    <span>
      <YamlEditorDialog isOpen={isOpen} setIsOpen={setIsOpen} yamlString={sampleYaml} />

      <Button
        aria-label={t('buttons.editResource')}
        design={'Transparent'}
        title={t('buttons.editResource')}
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <YamlIcon />
      </Button>
    </span>
  );
};

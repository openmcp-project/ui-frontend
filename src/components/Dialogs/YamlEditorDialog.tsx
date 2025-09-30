import { Bar, Button, Dialog } from '@ui5/webcomponents-react';
import YamlEditor from '../Ui/YamlEditor/YamlEditor';
import { useTranslation } from 'react-i18next';

interface YamlEditorDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  yamlString: string;
}

export function YamlEditorDialog({ isOpen, setIsOpen, yamlString }: YamlEditorDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog
      headerText={t('YamlEditor.title')}
      open={isOpen}
      footer={<Bar endContent={<Button onClick={() => setIsOpen(false)}>{t('buttons.close')}</Button>} />}
      onClose={() => setIsOpen(false)}
    >
      <YamlEditor yamlString={yamlString} />
    </Dialog>
  );
}

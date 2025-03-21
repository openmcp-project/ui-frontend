import { Dialog, Button, Bar } from '@ui5/webcomponents-react';
import { ReactNode } from 'react';

interface KubectlDialogProps {
  onClose: () => void;
  headerText: string;
  children: ReactNode;
}

export const KubectlDialog = ({
  onClose,
  headerText,
  children,
}: KubectlDialogProps) => {
  return (
    <Dialog
      headerText={headerText}
      open={true}
      onClose={onClose}
      style={{ width: '550px' }}
      footer={<Bar endContent={<Button onClick={onClose}>Close</Button>} />}
    >
      {children}
    </Dialog>
  );
};

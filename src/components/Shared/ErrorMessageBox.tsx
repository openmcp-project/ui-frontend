import { MessageBox, MessageBoxType } from '@ui5/webcomponents-react';
import { forwardRef, useImperativeHandle, useState } from 'react';

export interface ErrorDialogHandle {
  showErrorDialog: (message: string) => void;
}

export const ErrorDialog = forwardRef<ErrorDialogHandle>((_, ref) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  useImperativeHandle(ref, () => ({
    showErrorDialog: (msg: string) => {
      setMessage(msg);
      setOpen(true);
    },
  }));
  return (
    <>
      <MessageBox
        open={open}
        type={MessageBoxType.Error}
        onClose={() => setOpen(false)}
      >
        {message}
      </MessageBox>
    </>
  );
});

import { ReactNode } from 'react';
import { Dialog as UI5Dialog } from '@ui5/webcomponents-react';
import { DialogPropTypes } from '@ui5/webcomponents-react/Dialog';

export interface DialogProps extends Omit<DialogPropTypes, 'open'> {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Renders a UI5 `<Dialog>` component with a controlled open state that only renders its `children` when it is open.
 *
 * Usage:
 * ```tsx
 * const { isOpen, open, close } = useDialog();
 *
 * <button onClick={open}>Open</button>
 * <Dialog isOpen={isOpen} onClose={close} ...otherUi5DialogProps>
 *   content
 * </Dialog>
 * ```
 */
export function Dialog({ isOpen, onClose, children, ...rest }: DialogProps) {
  return (
    <UI5Dialog {...rest} open={isOpen} onClose={onClose}>
      {isOpen ? children : null}
    </UI5Dialog>
  );
}

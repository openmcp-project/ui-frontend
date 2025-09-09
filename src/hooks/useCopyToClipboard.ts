import { useCallback } from 'react';
import { useToast } from '../context/ToastContext.tsx';
import { useTranslation } from 'react-i18next';

export type CopyFn = (text: string, showToastOnSuccess?: boolean) => Promise<boolean>;

export function useCopyToClipboard(): { copyToClipboard: CopyFn } {
  const toast = useToast();
  const { t } = useTranslation();

  const copyToClipboard: CopyFn = useCallback(
    async (text, showToastOnSuccess = true) => {
      if (!navigator.clipboard) {
        toast.show(t('common.copyToClipboardFailedToast'));
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        if (showToastOnSuccess) {
          toast.show(t('common.copyToClipboardSuccessToast'));
        }
        return true;
      } catch (error) {
        toast.show(t('common.copyToClipboardFailedToast'));
        console.error(error);
        return false;
      }
    },
    [toast, t],
  );

  return { copyToClipboard };
}

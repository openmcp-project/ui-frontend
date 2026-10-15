import { useCallback } from 'react';
import { useToast } from '../context/ToastContext.tsx';
import { useTranslation } from 'react-i18next';
import { useTelemetry } from '../lib/telemetry/telemetry.ts';

export type CopyFn = (text: string, options?: { showToastOnSuccess: boolean }) => Promise<boolean>;

export function useCopyToClipboard(): { copyToClipboard: CopyFn } {
  const toast = useToast();
  const { t } = useTranslation();
  const telemetry = useTelemetry();

  const copyToClipboard: CopyFn = useCallback(
    async (text, options = { showToastOnSuccess: true }) => {
      if (!navigator.clipboard) {
        toast.show(t('common.copyToClipboardFailedToast'));
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        if (options.showToastOnSuccess) {
          toast.show(t('common.copyToClipboardSuccessToast'));
        }
        return true;
      } catch (error) {
        toast.show(t('common.copyToClipboardFailedToast'));
        telemetry.report(error, { message: 'Failed to copy to clipboard' });
        return false;
      }
    },
    [toast, t, telemetry],
  );

  return { copyToClipboard };
}

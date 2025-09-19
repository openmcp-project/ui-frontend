import { Button, Menu, MenuItem } from '@ui5/webcomponents-react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { useRef, useState } from 'react';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';
import { useMcp } from '../../lib/shared/McpContext.tsx';
import { useTranslation } from 'react-i18next';

export default function CopyKubeconfigButton() {
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { copyToClipboard } = useCopyToClipboard();
  const { t } = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenerClick = (e: any) => {
    if (popoverRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ref = popoverRef.current as any;
      ref.opener = e.target;
      setOpen((prev) => !prev);
    }
  };
  const mcp = useMcp();

  return (
    <>
      <Button icon="slim-arrow-down" icon-end onClick={handleOpenerClick}>
        {t('CopyKubeconfigButton.kubeconfigButton')}
      </Button>
      <Menu
        ref={popoverRef}
        open={open}
        onItemClick={(event) => {
          if (event.detail.item.dataset.action === 'download') {
            DownloadKubeconfig(mcp.kubeconfig, mcp.name);
            return;
          }
          if (event.detail.item.dataset.action === 'copy') {
            void copyToClipboard(mcp.kubeconfig ?? '');
          }

          setOpen(false);
        }}
      >
        <MenuItem
          key={'download'}
          text={t('CopyKubeconfigButton.menuDownload')}
          data-action="download"
          icon="download"
        />
        <MenuItem key={'copy'} text={t('CopyKubeconfigButton.menuCopy')} data-action="copy" icon="copy" />
      </Menu>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DownloadKubeconfig(config: any, displayName: string) {
  const filename = 'kubeconfig-' + displayName + '.yaml';

  try {
    const file = new File([config], filename, {
      type: 'application/yaml',
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(file);

    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
  }
  // dynaLeaveAction(id);
}

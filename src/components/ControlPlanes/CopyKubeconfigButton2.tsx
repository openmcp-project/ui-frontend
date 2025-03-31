import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';
import { useToast } from '../../context/ToastContext.tsx';
import { useTranslation } from 'react-i18next';
import { useMcp } from '../../lib/shared/McpContext.tsx';
import { Icon } from '../../@ui-components/Icon/Icon.tsx';
import { Menu } from '../../@ui-components/Menu/Menu.tsx';
import { MenuButton } from '../../@ui-components/Menu/MenuButton.tsx';
import { MenuList } from '../../@ui-components/Menu/MenuList.tsx';
import { MenuItem } from '../../@ui-components/Menu/MenuItem.tsx';

import classes from './CopyKubeconfigButton2.module.css';

export default function CopyKubeconfigButton2() {
  const { show } = useToast();
  const { t } = useTranslation();

  const mcp = useMcp();
  function handleCopy() {
    try {
      navigator.clipboard.writeText(mcp.kubeconfig ?? '');
      show(t('CopyKubeconfigButton.copiedMessage'));
    } catch (error) {
      //TODO: handle error, show error to user
      show(`${t('CopyKubeconfigButton.failedMessage')} ${error}`);
      console.error(error);
    }
  }

  return (
    <Menu>
      <MenuButton>Kubeconfig</MenuButton>

      <MenuList>
        <MenuItem onAction={() => DownloadKubeconfig(mcp.kubeconfig, mcp.name)}>
          <div>
            <Icon className={classes.icon} src="download" />
            Download
          </div>
        </MenuItem>
        <MenuItem onAction={handleCopy}>
          <div>
            <Icon className={classes.icon} src="copy" />
            Copy to Clipboard
          </div>
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

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
    debugger;
    console.error(error);
  }
  // dynaLeaveAction(id);
}

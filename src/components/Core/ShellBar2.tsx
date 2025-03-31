import { generateInitialsForEmail } from '../ControlPlanes/List/MembersAvatarView.tsx';
import { useAuth } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';
import { Shellbar as MCPShellbar } from '../../@ui-components/Shellbar/Shellbar';
import { Avatar } from '../../@ui-components/Avatar/Avatar.tsx';
import { Menu } from '../../@ui-components/Menu/Menu.tsx';
import { Icon } from '../../@ui-components/Icon/Icon.tsx';
import { MenuList } from '../../@ui-components/Menu/MenuList.tsx';
import { MenuItem } from '../../@ui-components/Menu/MenuItem.tsx';
import classes from './Shellbar2.module.css';

export function ShellBar2() {
  const auth = useAuth();
  const { t } = useTranslation();

  return (
    <MCPShellbar
      title={'MCP'}
      logoSrc={'/logo.png'}
      rightContent={
        <Menu>
          <Avatar
            initials={generateInitialsForEmail(auth.user?.profile.email)}
          />
          <MenuList>
            <MenuItem onAction={auth.removeUser}>
              <>
                <Icon className={classes.icon} src="log" />{' '}
                {t('ShellBar.signOutButton')}
              </>
            </MenuItem>
          </MenuList>
        </Menu>
      }
    />
  );
}

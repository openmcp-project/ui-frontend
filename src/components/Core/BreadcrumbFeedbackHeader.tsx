import { Button, FlexBox, FlexBoxAlignItems, Menu, MenuItem } from '@ui5/webcomponents-react';

import { useTranslation } from 'react-i18next';
import { FeedbackButton } from './FeedbackButton.tsx';
import { BetaButton } from './BetaButton.tsx';
import { useRef, useState } from 'react';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { SearchParamToggleVisibility } from '../Helper/FeatureToggleExistance.tsx';
import { PathAwareBreadcrumbs } from './PathAwareBreadcrumbs/PathAwareBreadcrumbs.tsx';

export function BreadcrumbFeedbackHeader() {
  return (
    <FlexBox alignItems={FlexBoxAlignItems.Center}>
      <PathAwareBreadcrumbs />
      <BetaButton />
      <FeedbackButton />
      <SearchParamToggleVisibility
        shouldBeVisible={(params) => {
          if (params === undefined) return false;
          if (params.get('showHeaderBar') === null) return false;
          return params?.get('showHeaderBar') === 'false';
        }}
      >
        <LogoutMenu />
      </SearchParamToggleVisibility>
    </FlexBox>
  );
}

function LogoutMenu() {
  const auth = useAuthOnboarding();
  const { t } = useTranslation();

  const buttonRef = useRef(null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  return (
    <>
      <Button
        ref={buttonRef}
        icon="menu2"
        onClick={() => {
          setMenuIsOpen(true);
        }}
      />
      <Menu
        opener={buttonRef.current}
        open={menuIsOpen}
        onClose={() => {
          setMenuIsOpen(false);
        }}
      >
        <MenuItem
          icon="log"
          text={t('ShellBar.signOutButton')}
          onClick={async () => {
            setMenuIsOpen(false);
            await auth.logout();
          }}
        />
      </Menu>
    </>
  );
}

import {
  Breadcrumbs,
  BreadcrumbsDomRef,
  Button,
  FlexBox,
  FlexBoxAlignItems,
  Menu,
  MenuItem,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { BreadcrumbsItem } from '@ui5/webcomponents-react/wrappers';
import { NavigateOptions, useParams } from 'react-router-dom';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import LandscapeLabel from './LandscapeLabel.tsx';
import { useTranslation } from 'react-i18next';
import { FeedbackButton } from './FeedbackButton.tsx';
import { BetaButton } from './BetaButton.tsx';
import { useRef, useState } from 'react';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { SearchParamToggleVisibility } from '../Helper/FeatureToggleExistance.tsx';

const PREFIX = '/mcp';

function navigateFromBreadcrumbs(navigate: (to: string, options?: NavigateOptions) => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (event: Ui5CustomEvent<BreadcrumbsDomRef, any>) => {
    event.preventDefault();
    // @ts-ignore
    const href = event.detail.item.href;
    navigate(href);
  };
}

export default function IntelligentBreadcrumbs() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const navigate = useLuigiNavigate();
  const { t } = useTranslation();

  return (
    <>
      <Breadcrumbs onItemClick={navigateFromBreadcrumbs(navigate)}>
        <BreadcrumbsItem href={`${PREFIX}/projects`}>
          <LandscapeLabel /> {t('IntelligentBreadcrumbs.homeLabel')}{' '}
        </BreadcrumbsItem>
        {projectName && (
          <>
            <BreadcrumbsItem href={`${PREFIX}/projects`}>{t('IntelligentBreadcrumbs.projects')}</BreadcrumbsItem>
            <BreadcrumbsItem href={`${PREFIX}/projects/${projectName}`}>{projectName}</BreadcrumbsItem>
            {workspaceName && (
              <>
                <BreadcrumbsItem href={`${PREFIX}/projects/${projectName}`}>
                  {t('IntelligentBreadcrumbs.workspaces')}
                </BreadcrumbsItem>
                <BreadcrumbsItem href={`${PREFIX}/projects/${projectName}`}>{workspaceName}</BreadcrumbsItem>
                {controlPlaneName && (
                  <>
                    <BreadcrumbsItem href={`${PREFIX}/projects/${projectName}`}>
                      {t('IntelligentBreadcrumbs.mcps')}
                    </BreadcrumbsItem>
                    <BreadcrumbsItem
                      href={`${PREFIX}/projects/${projectName}/workspaces/${workspaceName}/mcps/${controlPlaneName}`}
                    >
                      {controlPlaneName}
                    </BreadcrumbsItem>
                  </>
                )}
              </>
            )}
          </>
        )}
      </Breadcrumbs>
    </>
  );
}

export function BreadCrumbFeedbackHeader() {
  return (
    <FlexBox alignItems={FlexBoxAlignItems.Center}>
      <IntelligentBreadcrumbs />
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

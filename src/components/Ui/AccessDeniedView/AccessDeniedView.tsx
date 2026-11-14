import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { IllustratedBanner } from '../IllustratedBanner/IllustratedBanner.tsx';
import { Center } from '../Center/Center.tsx';

export interface AccessDeniedViewProps {
  /** Invoked when the user clicks the back button. */
  onBack: () => void;
  /** When set, renders a "Request access" mailto/action button alongside the back button. */
  requestAccessHref?: string;
  title?: string;
  details?: string;
}

/**
 * Shown when access to a resource is confirmed denied (not when it's merely
 * unknown or still loading). Explains the reason instead of pretending the
 * resource does not exist. Shared by the MCP page gate and the V2 page.
 */
export function AccessDeniedView({ onBack, requestAccessHref, title, details }: AccessDeniedViewProps) {
  const { t } = useTranslation();

  return (
    <Center>
      <IllustratedBanner
        illustrationName={IllustrationMessageType.UnableToLoad}
        title={title ?? t('mcp.authorization.accessDenied.title')}
        subtitle={details ?? t('mcp.authorization.accessDenied.details')}
        button={
          <>
            {requestAccessHref ? (
              <a href={requestAccessHref}>
                <Button design="Transparent" icon="email">
                  {t('AccessDeniedView.requestAccess')}
                </Button>
              </a>
            ) : null}
            <Button design="Default" icon="navigation-left-arrow" onClick={onBack}>
              {t('mcp.authorization.backToWorkspaces')}
            </Button>
          </>
        }
      />
    </Center>
  );
}

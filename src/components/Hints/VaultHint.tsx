import { Card, CardHeader, ProgressIndicator, Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { APIError } from '../../lib/api/error';
import { getDisabledCardStyle } from './Hints';
import { ManagedResourceItem } from '../../lib/shared/types';

interface VaultHintProps {
  enabled?: boolean;
  version?: string;
  onActivate?: () => void;
  allItems?: ManagedResourceItem[];
  isLoading?: boolean;
  error?: APIError;
}

export const VaultHint: React.FC<VaultHintProps> = ({
  enabled = false,
  version,
  onActivate,
  allItems = [],
  isLoading,
  error,
}) => {
  const { t } = useTranslation();

  const cardStyle = enabled ? {} : getDisabledCardStyle();

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Card
        header={
          <CardHeader
            additionalText={enabled ? `${t('Hints.VaultHint.activeStatus')}${version ?? ''}` : undefined}
            avatar={
              <img
                src="/vault.png"
                alt="Vault"
                style={{ width: 50, height: 50, borderRadius: '0', background: 'transparent', objectFit: 'cover' }}
              />
            }
            titleText={t('Hints.VaultHint.title')}
            subtitleText={t('Hints.VaultHint.subtitle')}
            interactive={false}
          />
        }
        style={cardStyle}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
          {isLoading ? (
            <ProgressIndicator
              value={0}
              displayValue={t('Hints.common.loading')}
              valueState="None"
              style={{ width: '80%', maxWidth: 500, minWidth: 120 }}
            />
          ) : error ? (
            <ProgressIndicator
              value={0}
              displayValue={t('Hints.common.errorLoadingResources')}
              valueState="Negative"
              style={{ width: '80%', maxWidth: 500, minWidth: 120 }}
            />
          ) : (
            <ProgressIndicator
              value={allItems.length > 0 ? 100 : 0}
              displayValue={enabled ? (allItems.length > 0 ? `100${t('Hints.VaultHint.progressAvailable')}` : t('Hints.VaultHint.noResources')) : t('Hints.VaultHint.inactive')}
              valueState={enabled ? (allItems.length > 0 ? 'Positive' : 'None') : 'None'}
              style={{ width: '80%', maxWidth: 500, minWidth: 120 }}
            />
          )}
        </div>
        {!enabled && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 2,
              pointerEvents: 'auto',
            }}
          >
            <Button design="Emphasized" onClick={onActivate}>
              {t('Hints.VaultHint.activate')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

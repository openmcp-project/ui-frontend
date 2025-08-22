import { Card, CardHeader, Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import cx from 'clsx';
import { APIError } from '../../lib/api/error';
import { styles } from './Hints';
import { ManagedResourceItem } from '../../lib/shared/types';
import { MultiPercentageBar } from '../Shared/MultiPercentageBar';

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
        className={cx({
          [styles['disabled']]: !enabled,
        })}
      >
        {/* Disabled overlay */}
        {!enabled && <div className={styles.disabledOverlay} />}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            width: '100%', 
            maxWidth: 500, 
            padding: '0 1rem' 
          }}>
            {(() => {
              if (isLoading) {
                // Show loading animation with a single gray segment
                return (
                  <MultiPercentageBar 
                    segments={[{
                      percentage: 100,
                      color: '#e9e9e9ff',
                      label: 'Loading'
                    }]}
                    style={{ width: '100%' }}
                    label={t('Hints.common.loading')}
                    showPercentage={false} // Hide percentage for loading
                    isHealthy={false} // Not healthy styling for loading
                  />
                );
              }
              
              if (error) {
                // Show error state with red segment
                return (
                  <MultiPercentageBar 
                    segments={[{
                      percentage: 100,
                      color: '#d22020ff',
                      label: 'Error'
                    }]}
                    style={{ width: '100%' }}
                    label={t('Hints.common.errorLoadingResources')}
                    showPercentage={false} // Hide percentage for error
                    isHealthy={false} // Not healthy styling for error
                  />
                );
              }
              
              // Show appropriate state based on enabled status
              if (!enabled) {
                return (
                  <MultiPercentageBar 
                    segments={[{
                      percentage: 100,
                      color: '#e9e9e9ff',
                      label: 'Inactive'
                    }]}
                    style={{ width: '100%' }}
                    label={t('Hints.VaultHint.inactive')}
                    showPercentage={false} // Hide percentage when inactive
                    isHealthy={false} // Not healthy styling for inactive
                  />
                );
              }

              const label = allItems.length > 0 ? `100${t('Hints.VaultHint.progressAvailable')}` : t('Hints.VaultHint.noResources');
              const color = allItems.length > 0 ? '#28a745' : '#e9e9e9ff';
              const isCurrentlyHealthy = allItems.length > 0;
              
              return (
                <MultiPercentageBar 
                  segments={[{
                    percentage: 100,
                    color: color,
                    label: 'Active'
                  }]}
                  style={{ width: '100%' }}
                  label={label}
                  showPercentage={true} // Show percentage when active
                  isHealthy={isCurrentlyHealthy} // Healthy if has items
                />
              );
            })()}
          </div>
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

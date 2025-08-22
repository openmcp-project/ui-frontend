import { Card, CardHeader, Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import cx from 'clsx';
import { APIError } from '../../lib/api/error';
import { styles } from './Hints';
import { ManagedResourceItem } from '../../lib/shared/types';
import { MultiPercentageBar } from '../Shared/MultiPercentageBar';
import React from 'react';

interface GitOpsHintProps {
  enabled?: boolean;
  version?: string;
  onActivate?: () => void;
  allItems?: ManagedResourceItem[];
  isLoading?: boolean;
  error?: APIError;
}

export const GitOpsHint: React.FC<GitOpsHintProps> = ({
  enabled = false,
  version,
  onActivate,
  allItems = [],
  isLoading,
  error,
}) => {
  const { t } = useTranslation();

  const totalCount = allItems.length;

  // Count the number of items with the flux label
  const fluxLabelCount = allItems.filter(
    (item: ManagedResourceItem) =>
      item?.metadata?.labels &&
      Object.prototype.hasOwnProperty.call(item.metadata.labels, 'kustomize.toolkit.fluxcd.io/name'),
  ).length;

  const progressValue = totalCount > 0 ? Math.round((fluxLabelCount / totalCount) * 100) : 0;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Card
        header={
          <CardHeader
            additionalText={enabled ? `v${version ?? ''}` : undefined}
            avatar={
              <img
                src="/flux.png"
                alt="Flux"
                style={{ width: 50, height: 50, borderRadius: '50%', background: 'transparent', objectFit: 'cover' }}
              />
            }
            titleText={t('Hints.GitOpsHint.title')}
            subtitleText={t('Hints.GitOpsHint.subtitle')}
            interactive={enabled}
          />
        }
        className={cx({
          [styles['disabled']]: !enabled,
        })}
        onClick={enabled ? () => {
          const el = document.querySelector('.cp-page-section-gitops');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } : undefined}
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

              // If not enabled, show inactive state
              if (!enabled) {
                return (
                  <MultiPercentageBar 
                    segments={[{
                      percentage: 100,
                      color: '#e9e9e9ff',
                      label: 'Inactive'
                    }]}
                    style={{ width: '100%' }}
                    label={t('Hints.GitOpsHint.inactive')}
                    showPercentage={false} // Hide percentage when inactive
                    isHealthy={false} // Not healthy styling for inactive
                  />
                );
              }

              // If no items, show no resources state
              if (totalCount === 0) {
                return (
                  <MultiPercentageBar 
                    segments={[{
                      percentage: 100,
                      color: '#e9e9e9ff',
                      label: 'No Resources'
                    }]}
                    style={{ width: '100%' }}
                    label={t('Hints.GitOpsHint.noResources')}
                    showPercentage={false} // Hide percentage when no resources
                    isHealthy={false} // Not healthy styling for no resources
                  />
                );
              }

              const restPercentage = 100 - progressValue;
              const progressColor = progressValue >= 70 ? '#28a745' : '#fd7e14'; // Green over 70%, orange under 70%
              
              const segments = [
                {
                  percentage: progressValue,
                  color: progressColor,
                  label: 'Progress'
                },
                {
                  percentage: restPercentage,
                  color: '#e9e9e9ff', // Same as background color
                  label: 'Remaining'
                }
              ];

              // Show appropriate label based on enabled status
              const label = 'Managed';
              const isCurrentlyHealthy = progressValue >= 70; // Consider healthy if 70% or more managed

              return (
                <MultiPercentageBar 
                  segments={segments}
                  style={{ width: '100%' }}
                  label={label}
                  showOnlyNonZero={false}
                  showPercentage={true} // Show percentage when active with data
                  isHealthy={isCurrentlyHealthy} // Healthy if 70% or more managed
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
              {t('Hints.GitOpsHint.activate')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

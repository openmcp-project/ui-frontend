import { Card, CardHeader, Button } from '@ui5/webcomponents-react';
import { RadarChart } from '@ui5/webcomponents-react-charts';
import { useTranslation } from 'react-i18next';
import cx from 'clsx';
import { APIError } from '../../lib/api/error';
import { styles } from './Hints';
import { ManagedResourceItem, Condition } from '../../lib/shared/types';
import { MultiPercentageBar } from '../Shared/MultiPercentageBar';
import React, { useMemo } from 'react';

interface CrossplaneHintProps {
  enabled?: boolean;
  version?: string;
  onActivate?: () => void;
  allItems?: ManagedResourceItem[];
  isLoading?: boolean;
  error?: APIError;
}

export const CrossplaneHint: React.FC<CrossplaneHintProps> = ({
  enabled = false,
  version,
  onActivate,
  allItems = [],
  isLoading,
  error,
}) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = React.useState(false);

  // Memoize resource type health calculations
  const { resourceTypeHealth, resourceTypeTotal } = useMemo(() => {
    const typeHealth: Record<string, number> = {};
    const typeTotal: Record<string, number> = {};
    
    allItems.forEach((item: ManagedResourceItem) => {
      const type = item.kind || 'Unknown';
      typeTotal[type] = (typeTotal[type] || 0) + 1;
      const conditions = item.status?.conditions || [];
      const ready = conditions.find((c: Condition) => c.type === 'Ready' && c.status === 'True');
      const synced = conditions.find((c: Condition) => c.type === 'Synced' && c.status === 'True');
      if (ready && synced) {
        typeHealth[type] = (typeHealth[type] || 0) + 1;
      }
    });

    return { resourceTypeHealth: typeHealth, resourceTypeTotal: typeTotal };
  }, [allItems]);

  // Memoize radar chart dataset
  const radarDataset = useMemo(() => {
    return Object.keys(resourceTypeTotal).map(type => {
      const total = resourceTypeTotal[type];
      const healthy = resourceTypeHealth[type] || 0;
      
      // Count creating resources (no conditions yet or unknown status)
      const creating = allItems.filter((item: ManagedResourceItem) => {
        if (item.kind !== type) return false;
        const conditions = item.status?.conditions || [];
        const hasReadyCondition = conditions.some((c: Condition) => c.type === 'Ready');
        const hasSyncedCondition = conditions.some((c: Condition) => c.type === 'Synced');
        return !hasReadyCondition || !hasSyncedCondition;
      }).length;
      
      return {
        type,
        healthy: Math.round((healthy / total) * 100),
        creating: Math.round((creating / total) * 100)
      };
    });
  }, [allItems, resourceTypeHealth, resourceTypeTotal]);

  // Memoize health status calculations
  const healthStats = useMemo(() => {
    const totalCount = allItems.length;

    if (totalCount === 0) {
      return {
        totalCount: 0,
        healthyCount: 0,
        creatingCount: 0,
        unhealthyCount: 0,
        healthyPercentage: 0,
        creatingPercentage: 0,
        unhealthyPercentage: 0,
        isCurrentlyHealthy: false
      };
    }

    const healthyCount = allItems.filter((item: ManagedResourceItem) => {
      const conditions = item.status?.conditions || [];
      const ready = conditions.find((c: Condition) => c.type === 'Ready' && c.status === 'True');
      const synced = conditions.find((c: Condition) => c.type === 'Synced' && c.status === 'True');
      return !!ready && !!synced;
    }).length;

    const creatingCount = allItems.filter((item: ManagedResourceItem) => {
      const conditions = item.status?.conditions || [];
      const ready = conditions.find((c: Condition) => c.type === 'Ready' && c.status === 'True');
      const synced = conditions.find((c: Condition) => c.type === 'Synced' && c.status === 'True');
      return !!synced && !ready;
    }).length;

    const unhealthyCount = totalCount - healthyCount - creatingCount;
    const healthyPercentage = Math.round((healthyCount / totalCount) * 100);
    const creatingPercentage = Math.round((creatingCount / totalCount) * 100);
    const unhealthyPercentage = Math.round((unhealthyCount / totalCount) * 100);
    const isCurrentlyHealthy = healthyPercentage === 100 && totalCount > 0;

    return {
      totalCount,
      healthyCount,
      creatingCount,
      unhealthyCount,
      healthyPercentage,
      creatingPercentage,
      unhealthyPercentage,
      isCurrentlyHealthy
    };
  }, [allItems]);

  // Memoize segments for the percentage bar
  const segments = useMemo(() => {
    return [
      {
        percentage: healthStats.healthyPercentage,
        color: '#28a745',
        label: 'Healthy'
      },
      {
        percentage: healthStats.creatingPercentage,
        color: '#e9730c',
        label: 'Creating'
      },
      {
        percentage: healthStats.unhealthyPercentage,
        color: '#d22020ff',
        label: 'Unhealthy'
      }
    ];
  }, [healthStats]);

  const totalCount = allItems.length;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Card
        header={
          <CardHeader
            additionalText={enabled ? `v${version ?? ''}` : undefined}
            avatar={
              <img
                src="/crossplane-icon.png"
                alt="Crossplane"
                style={{ width: 50, height: 50, borderRadius: '50%', background: 'transparent', objectFit: 'cover' }}
              />
            }
            titleText={t('Hints.CrossplaneHint.title')}
            subtitleText={t('Hints.CrossplaneHint.subtitle')}
            interactive={enabled}
          />
        }
        className={cx({
          [styles['disabled']]: !enabled,
        })}
        onClick={enabled ? () => {
          const el = document.querySelector('.crossplane-table-element');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } : undefined}
        onMouseEnter={enabled ? () => setHovered(true) : undefined}
        onMouseLeave={enabled ? () => setHovered(false) : undefined}
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
                return (
                  <MultiPercentageBar 
                    segments={[{
                      percentage: 100,
                      color: '#e9e9e9ff',
                      label: 'Loading'
                    }]}
                    style={{ width: '100%' }}
                    label={t('Hints.common.loading')}
                    showPercentage={false}
                    isHealthy={false}
                  />
                );
              }
              
              if (error) {
                return (
                  <MultiPercentageBar 
                    segments={[{
                      percentage: 100,
                      color: '#d22020ff',
                      label: 'Error'
                    }]}
                    style={{ width: '100%' }}
                    label={t('Hints.common.errorLoadingResources')}
                    showPercentage={false}
                    isHealthy={false}
                  />
                );
              }

              if (!enabled) {
                return (
                  <MultiPercentageBar 
                    segments={[{
                      percentage: 100,
                      color: '#e9e9e9ff',
                      label: 'Inactive'
                    }]}
                    style={{ width: '100%' }}
                    label={t('Hints.CrossplaneHint.inactive')}
                    showPercentage={false}
                    isHealthy={false}
                  />
                );
              }

              if (totalCount === 0) {
                return (
                  <MultiPercentageBar 
                    segments={[{
                      percentage: 100,
                      color: '#e9e9e9ff',
                      label: 'No Resources'
                    }]}
                    style={{ width: '100%' }}
                    label={t('Hints.CrossplaneHint.noResources')}
                    showPercentage={false}
                    isHealthy={false}
                  />
                );
              }

              return (
                <MultiPercentageBar 
                  segments={segments}
                  style={{ width: '100%' }}
                  label="Resources"
                  showPercentage={true}
                  isHealthy={healthStats.isCurrentlyHealthy}
                />
              );
            })()}
          </div>
        </div>
        {/* RadarChart for resource healthiness, only show on hover when enabled */}
        {enabled && hovered && !isLoading && !error && radarDataset.length > 0 && (
          <div style={{ 
            width: '100%', 
            height: 300, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            margin: '1rem 0',
            overflow: 'visible'
          }}>
            <RadarChart
              dataset={radarDataset}
              dimensions={[{ accessor: 'type' }]}
              measures={[
                {
                  accessor: 'healthy',
                  color: '#28a745',
                  hideDataLabel: true,
                  label: 'Healthy (%)'
                },
                {
                  accessor: 'creating',
                  color: '#fd7e14',
                  hideDataLabel: true,
                  label: 'Creating (%)'
                }
              ]}
              style={{ width: '100%', height: '100%', minWidth: 280, minHeight: 280 }}
              noLegend={false}
            />
          </div>
        )}
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
              {t('Hints.CrossplaneHint.activate')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

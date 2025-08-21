import { Card, CardHeader, ProgressIndicator, Button } from '@ui5/webcomponents-react';
import { RadarChart } from '@ui5/webcomponents-react-charts';
import { useTranslation } from 'react-i18next';
import { APIError } from '../../lib/api/error';
import { getDisabledCardStyle } from './Hints';
import { ManagedResourceItem, Condition } from '../../lib/shared/types';
import React from 'react';

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

  const cardStyle = enabled ? {} : getDisabledCardStyle();

  // Aggregate healthiness by resource type
  const resourceTypeHealth: Record<string, number> = {};
  const resourceTypeTotal: Record<string, number> = {};
  allItems.forEach((item: ManagedResourceItem) => {
    const type = item.kind || 'Unknown';
    resourceTypeTotal[type] = (resourceTypeTotal[type] || 0) + 1;
    const conditions = item.status?.conditions || [];
    const ready = conditions.find((c: Condition) => c.type === 'Ready' && c.status === 'True');
    const synced = conditions.find((c: Condition) => c.type === 'Synced' && c.status === 'True');
    if (ready && synced) {
      resourceTypeHealth[type] = (resourceTypeHealth[type] || 0) + 1;
    }
  });

  // Prepare radar chart dataset: each resource type is a dimension, value is percent healthy
  const radarDataset = Object.keys(resourceTypeTotal).map(type => ({
    type,
    health: `${Math.round(((resourceTypeHealth[type] || 0) / resourceTypeTotal[type]) * 100)}%`
  }));

  // Progress bar logic (unchanged)
  const healthyCount = allItems.filter((item: ManagedResourceItem) => {
    const conditions = item.status?.conditions || [];
    const ready = conditions.find((c: Condition) => c.type === 'Ready' && c.status === 'True');
    const synced = conditions.find((c: Condition) => c.type === 'Synced' && c.status === 'True');
    return !!ready && !!synced;
  }).length;

  const totalCount = allItems.length;

  const progressValue = totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0;
  const progressDisplay = enabled
    ? allItems.length > 0
      ? `${Math.round((healthyCount / totalCount) * 100)}${t('Hints.CrossplaneHint.progressAvailable')}`
      : t('Hints.CrossplaneHint.noResources')
    : t('Hints.CrossplaneHint.inactive');
  const progressValueState = enabled
    ? allItems.length > 0
      ? healthyCount >= totalCount / 2 && totalCount > 0
        ? 'Positive'
        : 'Critical'
      : 'None'
    : 'None';

  const [hovered, setHovered] = React.useState(false);

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
            interactive={true}
          />
        }
        style={cardStyle}
        onClick={() => {
          const el = document.querySelector('.crossplane-table-element');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
          {isLoading ? (
            <ProgressIndicator
              value={0}
              displayValue={t('Hints.common.loading')}
              valueState="None"
              style={{ 
                width: '80%', 
                maxWidth: 500, 
                minWidth: 120,
              }}
            />
          ) : error ? (
            <ProgressIndicator
              value={0}
              displayValue={t('Hints.common.errorLoadingResources')}
              valueState="Negative"
              style={{ 
                width: '80%', 
                maxWidth: 500, 
                minWidth: 120,
              }}
            />
          ) : (
            <ProgressIndicator
              value={progressValue}
              displayValue={progressDisplay}
              valueState={progressValueState}
              style={{ 
                width: '80%', 
                maxWidth: 500, 
                minWidth: 120,
              }}
            />
          )}
        </div>
        {/* Minimal RadarChart for resource healthiness, only show on hover */}
        {hovered && !isLoading && !error && radarDataset.length > 0 && (
          <div style={{ width: 260, height: 260, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '1rem 0', overflow: 'visible' }}>
            <RadarChart
              dataset={radarDataset}
              dimensions={[{ accessor: 'type' }]}
              measures={[{
                accessor: 'health',
                color: 'green',
                hideDataLabel: true,
              }]}
              style={{ width: 220, height: 220 }}
              noLegend={true}
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

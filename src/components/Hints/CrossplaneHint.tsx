import { Card, CardHeader, ProgressIndicator, Button } from '@ui5/webcomponents-react';
import { ManagedResourcesResponse } from '../../lib/api/types/crossplane/listManagedResources';
import { useTranslation } from 'react-i18next';

interface CrossplaneHintProps {
  enabled?: boolean;
  version?: string;
  onActivate?: () => void;
  managedResources?: ManagedResourcesResponse | undefined;
  isLoading?: boolean;
  error?: any;
}

export const CrossplaneHint: React.FC<CrossplaneHintProps> = ({ enabled = false, version, onActivate, managedResources, isLoading, error }) => {
  const { t } = useTranslation();

  const cardStyle = enabled
    ? {}
    : {
        background: '#f3f3f3',
        filter: 'grayscale(0.7)',
        opacity: 0.7,
      };

  // Flatten all items from all managedResources entries
  const allItems = managedResources
    ? managedResources
        .filter((managedResource) => managedResource.items)
        .flatMap((managedResource) => managedResource.items)
    : [];
  
    // Health state counts for slider segments
  const healthyCount = allItems.filter((item: any) => {
    const conditions = item.status?.conditions || [];
    const ready = conditions.find((c: any) => c.type === 'Ready' && c.status === 'True');
    const synced = conditions.find((c: any) => c.type === 'Synced' && c.status === 'True');
    return !!ready && !!synced;
  }).length;

  const totalCount = allItems.length;

  // Progress value: percent of resources that are both Ready and Synced
  const progressValue = totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0;
  // Display value: show ratio
  const progressDisplay = enabled
    ? managedResources
  ? `${Math.round((healthyCount / totalCount) * 100)}% Available`
      : 'No Resources'
    : 'Inactive';
  // Value state: positive if half are ready & synced
  const progressValueState = enabled
    ? managedResources
      ? (healthyCount >= totalCount / 2 && totalCount > 0 ? 'Positive' : 'Critical')
      : 'None'
    : 'None';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Card
        header={
          <CardHeader
            additionalText={enabled ? `Active v${version ?? ''}` : undefined}
            avatar={
              <img
                src="/crossplane-icon.png"
                alt="Crossplane"
                style={{ width: 50, height: 50, borderRadius: '50%', background: 'transparent', objectFit: 'cover' }}
              />
            }
            titleText="Crossplane"
            subtitleText="Managed Resources Readiness"
          />
        }
        style={cardStyle}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
          {isLoading ? (
            <ProgressIndicator value={0} displayValue={t('Loading...')} valueState="None" style={{ width: '80%', maxWidth: 500, minWidth: 120 }} />
          ) : error ? (
            <ProgressIndicator value={0} displayValue={t('Error loading resources')} valueState="Negative" style={{ width: '80%', maxWidth: 500, minWidth: 120 }} />
          ) : (
            <ProgressIndicator
              value={progressValue}
              displayValue={progressDisplay}
              valueState={progressValueState}
              style={{ width: '80%', maxWidth: 500, minWidth: 120 }}
            />
          )}
        </div>
        {!enabled && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 2,
            pointerEvents: 'auto',
          }}>
            <Button design="Emphasized" onClick={onActivate}>
              Activate
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

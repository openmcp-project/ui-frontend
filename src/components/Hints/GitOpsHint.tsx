import { Card, CardHeader, ProgressIndicator, Button } from '@ui5/webcomponents-react';
import { ManagedResourcesResponse } from '../../lib/api/types/crossplane/listManagedResources';
import { useTranslation } from 'react-i18next';
import { APIError } from '../../lib/api/error';

interface GitOpsHintProps {
  enabled?: boolean;
  version?: string;
  onActivate?: () => void;
  managedResources?: ManagedResourcesResponse | undefined;
  isLoading?: boolean;
  error?: APIError;
}

export const GitOpsHint: React.FC<GitOpsHintProps> = ({
  enabled = false,
  version,
  onActivate,
  managedResources,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();

  // Flatten all items from all managedResources entries
  const allItems = managedResources
    ? managedResources
        .filter((managedResource) => managedResource.items)
        .flatMap((managedResource) => managedResource.items)
    : [];

  const totalCount = allItems.length;

  // Count the number of items with the flux label
  const fluxLabelCount = allItems.filter(
    (item) =>
      item?.metadata?.labels &&
      Object.prototype.hasOwnProperty.call(item.metadata.labels, 'kustomize.toolkit.fluxcd.io/name'),
  ).length;

  const progressValue = totalCount > 0 ? Math.round((fluxLabelCount / totalCount) * 100) : 0;
  // Display value: show ratio
  const progressDisplay = enabled
    ? managedResources
      ? `${Math.round((fluxLabelCount / totalCount) * 100)}% Available`
      : 'No Resources'
    : 'Inactive';
  // Value state: positive if half are ready & synced
  const progressValueState = enabled
    ? managedResources
      ? fluxLabelCount >= totalCount / 2 && totalCount > 0
        ? 'Positive'
        : 'Critical'
      : 'None'
    : 'None';

  const cardStyle = enabled
    ? {}
    : {
        background: '#f3f3f3',
        filter: 'grayscale(0.7)',
        opacity: 0.7,
      };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Card
        header={
          <CardHeader
            additionalText={enabled ? `Active v${version ?? ''}` : undefined}
            avatar={
              <img
                src="/flux.png"
                alt="Flux"
                style={{ width: 50, height: 50, borderRadius: '50%', background: 'transparent', objectFit: 'cover' }}
              />
            }
            titleText="Flux"
            subtitleText="GitOps Progress"
            interactive={true}
          />
        }
        style={cardStyle}
        onClick={() => {
          const el = document.querySelector('.cp-page-section-gitops');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
          {isLoading ? (
            <ProgressIndicator
              value={0}
              displayValue={t('Loading...')}
              valueState="None"
              style={{ width: '80%', maxWidth: 500, minWidth: 120 }}
            />
          ) : error ? (
            <ProgressIndicator
              value={0}
              displayValue={t('Error loading resources')}
              valueState="Negative"
              style={{ width: '80%', maxWidth: 500, minWidth: 120 }}
            />
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
              {t('Activate')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

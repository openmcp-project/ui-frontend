import { Card, CardHeader, ProgressIndicator, Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { APIError } from '../../lib/api/error';
import { getDisabledCardStyle } from './Hints';
import { ManagedResourceItem } from '../../lib/shared/types';

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
  // Display value: show ratio
  const progressDisplay = enabled
    ? allItems.length > 0
      ? `${Math.round((fluxLabelCount / totalCount) * 100)}${t('Hints.GitOpsHint.progressAvailable')}`
      : t('Hints.GitOpsHint.noResources')
    : t('Hints.GitOpsHint.inactive');
  // Value state: positive if half are ready & synced
  const progressValueState = enabled
    ? allItems.length > 0
      ? fluxLabelCount >= totalCount / 2 && totalCount > 0
        ? 'Positive'
        : 'Critical'
      : 'None'
    : 'None';

  const cardStyle = enabled ? {} : getDisabledCardStyle();

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
              {t('Hints.GitOpsHint.activate')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

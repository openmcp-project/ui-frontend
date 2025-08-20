import { Card, CardHeader, ProgressIndicator, Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';


interface VaultHintProps {
  enabled?: boolean;
  version?: string;
  onActivate?: () => void;
  managedResources?: any;
  isLoading?: boolean;
  error?: any;
}

export const VaultHint: React.FC<VaultHintProps> = ({ enabled = false, version, onActivate, managedResources, isLoading, error }) => {
  const { t } = useTranslation();

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
                src="/vault.png"
                alt="Vault"
                style={{ width: 50, height: 50, borderRadius: '0', background: 'transparent', objectFit: 'cover' }}
              />
            }
            titleText="Vault"
            subtitleText="Rotating Secrets Progress"
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
              value={managedResources ? 100 : 0}
              displayValue={enabled ? (managedResources ? '100% Available' : 'No Resources') : 'Inactive'}
              valueState={enabled ? (managedResources ? 'Positive' : 'None') : 'None'}
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

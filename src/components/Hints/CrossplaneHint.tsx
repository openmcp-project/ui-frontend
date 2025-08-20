import { Card, CardHeader, ProgressIndicator, Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';

interface CrossplaneHintProps {
  enabled?: boolean;
  onActivate?: () => void;
}

export const CrossplaneHint: React.FC<CrossplaneHintProps> = ({ enabled = false, onActivate }) => {
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
            additionalText={enabled ? 'Active' : undefined}
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
          <ProgressIndicator
            value={100}
            displayValue={enabled ? '100% Available' : 'Inactive'}
            valueState={enabled ? 'Positive' : 'None'}
            style={{ width: '80%', maxWidth: 500, minWidth: 120 }}
          />
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

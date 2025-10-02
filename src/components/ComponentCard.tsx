import { Button, Card, CardHeader, FlexBox, Link } from '@ui5/webcomponents-react';
import React, { JSX } from 'react';
import styles2 from './HintsCardsRow/GenericHintCard/GenericHintCard.module.css';
import { MultiPercentageBar } from './HintsCardsRow/MultiPercentageBar/MultiPercentageBar.tsx';

export interface ComponentCardProps {
  imgSrc?: string;
  componentName: string;
  subtitle: string;
  version: string;
  installed: boolean;
  percentage?: number;
  label?: string;
  onClick?: () => void;
}
export function ComponentCard({
  imgSrc,
  componentName,
  subtitle,
  version,
  installed,
  percentage,
  label,
  onClick,
}: ComponentCardProps) {
  return (
    <Card
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      header={
        <CardHeader
          titleText={componentName}
          avatar={<img alt="" style={{ borderRadius: '0' }} src={imgSrc} />}
          subtitleText={subtitle}
          interactive={!!onClick}
          additionalText={version}
        />
      }
      onClick={onClick}
    >
      <div style={{ padding: '1.5rem', height: '2.5rem', display: 'flex' }}>
        {installed ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'start',
                gap: '4px',
                width: '100%',
                flexDirection: 'column',
              }}
            >
              {`${percentage}% ${label}`}
              <MultiPercentageBar
                barWidth="100%"
                barMaxWidth="99999px"
                segments={[
                  {
                    percentage: percentage!,
                    color: 'var(--sapNeutralColor)',
                    label: 'x',
                  },
                  {
                    percentage: 100 - percentage!,
                    color: 'var(--sapNeutralBackground)',
                    label: 'x',
                  },
                ]}
                className={styles2.progressBar}
                showLabels={false}
                showPercentage={false}
                isHealthy={true}
                showOnlyNonZero={false}
              />
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'start',
                alignItems: 'center',
              }}
            >
              <div style={{ paddingLeft: '0', paddingRight: '2rem' }}>
                <Button design="Default" icon="sap-icon://add-product" onClick={() => alert('TODO')}>
                  {`Install ${componentName}`}
                </Button>
              </div>
              <div>
                <Button design="Transparent" endIcon="sap-icon://arrow-right" onClick={() => alert('TODO')}>
                  {`Learn more`}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

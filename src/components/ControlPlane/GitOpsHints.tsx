import { Button, Card, CardHeader, FlexBox, FlexBoxDirection, Link, Popover } from '@ui5/webcomponents-react';
import { GenericHintCard } from '../HintsCardsRow/GenericHintCard/GenericHintCard.tsx';
import React, { useState } from 'react';
import styles2 from '../HintsCardsRow/GenericHintCard/GenericHintCard.module.css';
import { HoverContent } from '../HintsCardsRow/CardHoverContent/CardHoverContent.tsx';
import cx from 'clsx';
import { styles } from '../HintsCardsRow/HintsCardsRow.tsx';
import { MultiPercentageBar } from '../HintsCardsRow/MultiPercentageBar/MultiPercentageBar.tsx';
import { BarChart } from '@ui5/webcomponents-react-charts';
import { Tooltip } from '../Helper/Tooltip.tsx';
import PopoverPlacement from '@ui5/webcomponents/types/PopoverPlacement';

export interface GitOpsHintsProps {
  isLoading: boolean;
}

export function GitOpsHints({ isLoading }: GitOpsHintsProps) {
  const [isPopoverOpen1, setIsPopoverOpen1] = useState(false);

  return (
    <>
      <FlexBox
        direction={FlexBoxDirection.Row}
        style={{
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          width: '100%',
          margin: '0 auto',

          //This breaks the scrolling currently since its zIndex is higher than the header bar
          height: '150px',
          zIndex: 2,
          position: 'relative',
        }}
      >
        <div className={styles2.container}>
          <Card
            loading={isLoading}
            header={<CardHeader titleText={'Health (fake data)'} subtitleText={`45% healthy`} interactive={false} />}
          >
            <div style={{ maxWidth: '99999px' }} className={styles2.contentContainer}>
              <div style={{ maxWidth: '99999px', paddingBottom: '0.5rem' }} className={styles2.progressBarContainer}>
                <MultiPercentageBar
                  barWidth="100%"
                  barMaxWidth="99999px"
                  style={{ paddingInline: '1rem' }}
                  segments={[
                    {
                      percentage: 45,
                      color: 'var(--sapPositiveElementColor)',
                      label: 'x',
                    },
                    {
                      percentage: 55,
                      color: 'var(--sapCriticalElementColor)',
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
          </Card>
        </div>

        <div className={styles2.container}>
          <Card
            loading={isLoading}
            header={
              <CardHeader
                titleText={'Adoption: 57% managed (fake data)'}
                subtitleText={`34% by GitRepositories, 23% by Helm`}
                interactive={false}
                action={
                  <Button
                    id="button1"
                    icon="sap-icon://sys-help"
                    design="Transparent"
                    onClick={() => setIsPopoverOpen1(true)}
                  />
                }
              />
            }
          >
            <div style={{ maxWidth: '99999px' }} className={styles2.contentContainer}>
              <div style={{ maxWidth: '99999px', paddingBottom: '0.5rem' }} className={styles2.progressBarContainer}>
                <MultiPercentageBar
                  barWidth="100%"
                  barMaxWidth="99999px"
                  style={{ paddingInline: '1rem' }}
                  segments={[
                    {
                      percentage: 34,
                      color: 'var(--sapPositiveElementColor)',
                      label: 'x',
                    },
                    {
                      percentage: 23,
                      color: 'var(--sapPositiveElementColor)',
                      label: 'x',
                    },
                    {
                      percentage: 43,
                      color: 'var(--sapCriticalElementColor)',
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
          </Card>
        </div>

        <div className={styles2.container}>
          {false && (
            <Card
              loading={isLoading}
              header={<CardHeader titleText={'Health'} subtitleText={`45% healthy (fake data)`} interactive={false} />}
            >
              <div style={{ maxWidth: '99999px' }} className={styles2.contentContainer}>
                <div style={{ maxWidth: '99999px', paddingBottom: '0.5rem' }} className={styles2.progressBarContainer}>
                  <MultiPercentageBar
                    barWidth="100%"
                    barMaxWidth="99999px"
                    style={{ paddingInline: '1rem' }}
                    segments={[
                      {
                        percentage: 45,
                        color: 'var(--sapPositiveElementColor)',
                        label: 'x',
                      },
                      {
                        percentage: 55,
                        color: 'var(--sapCriticalElementColor)',
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
            </Card>
          )}
        </div>
      </FlexBox>
      <Popover
        opener={'button1'}
        placement={PopoverPlacement.Bottom}
        open={isPopoverOpen1}
        onClose={() => {
          setIsPopoverOpen1(false);
        }}
      >
        <p>Text explaining why this is a nice thing to have.</p>
        <Link>More infos</Link> are available.
      </Popover>
    </>
  );
}

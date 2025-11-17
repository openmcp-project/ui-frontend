import React, { useId, useState } from 'react';
import { Button, Popover } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { ColorBy } from './types';
import styles from './Legend.module.css';

export interface LegendItem {
  name: string;
  color: string;
}

interface LegendProps {
  legendItems: LegendItem[];
  colorBy: ColorBy;
  onColorByChange: (colorBy: ColorBy) => void;
}

export const Legend: React.FC<LegendProps> = ({ legendItems, colorBy, onColorByChange }) => {
  const { t } = useTranslation();
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const colorButtonId = useId();

  return (
    <div className={styles.legendWrapper}>
      <div className={styles.legendContainer}>
        {legendItems.map(({ name, color }) => (
          <div key={name} className={styles.legendRow}>
            <div className={styles.legendColorBox} style={{ backgroundColor: color }} />
            <span>{name}</span>
          </div>
        ))}
      </div>
      <div className={styles.colorFilterContainer}>
        <Popover
          opener={colorButtonId}
          open={colorPopoverOpen}
          placement="Bottom"
          onClose={() => setColorPopoverOpen(false)}
        >
          <div className={styles.popoverContent}>
            <h4 className={styles.popoverHeader}>{t('Graphs.colorBy')}</h4>
            <div className={styles.popoverButtonContainer}>
              <Button
                design={colorBy === 'source' ? 'Emphasized' : 'Default'}
                onClick={() => {
                  onColorByChange('source');
                  setColorPopoverOpen(false);
                }}
              >
                {t('Graphs.colorsProvider')}
              </Button>
              <Button
                design={colorBy === 'provider' ? 'Emphasized' : 'Default'}
                onClick={() => {
                  onColorByChange('provider');
                  setColorPopoverOpen(false);
                }}
              >
                {t('Graphs.colorsProviderConfig')}
              </Button>
              <Button
                design={colorBy === 'flux' ? 'Emphasized' : 'Default'}
                onClick={() => {
                  onColorByChange('flux');
                  setColorPopoverOpen(false);
                }}
              >
                {t('Graphs.colorsFlux')}
              </Button>
            </div>
          </div>
        </Popover>
        <Button
          id={colorButtonId}
          design="Transparent"
          icon="palette"
          tooltip={t('Graphs.colorBy')}
          onClick={() => setColorPopoverOpen(!colorPopoverOpen)}
        />
      </div>
    </div>
  );
};

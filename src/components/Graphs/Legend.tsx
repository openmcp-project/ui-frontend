import React, { useId, useState } from 'react';
import { Button, Popover, Select, Option } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { ColorBy } from './types';
import type { LayoutDirection } from './Graph.model';
import styles from './Legend.module.css';

export interface LegendItem {
  name: string;
  color: string;
}

interface LegendProps {
  legendItems: LegendItem[];
  colorBy: ColorBy;
  onColorByChange: (colorBy: ColorBy) => void;
  labelKey?: string;
  availableLabelKeys?: string[];
  onLabelKeyChange?: (k: string | undefined) => void;
  layoutDirection?: LayoutDirection;
  onLayoutDirectionChange?: (dir: LayoutDirection) => void;
}

const COLOR_BY_OPTIONS: readonly { value: ColorBy; i18nKey: string; keepOpen?: boolean }[] = [
  { value: 'source', i18nKey: 'Graphs.colorsProvider' },
  { value: 'provider', i18nKey: 'Graphs.colorsProviderConfig' },
  { value: 'flux', i18nKey: 'Graphs.colorsFlux' },
  { value: 'label', i18nKey: 'Graphs.colorsLabel', keepOpen: true },
];

const LAYOUT_DIRECTION_OPTIONS: readonly { value: LayoutDirection; i18nKey: string }[] = [
  { value: 'TB', i18nKey: 'Graphs.layoutTB' },
  { value: 'LR', i18nKey: 'Graphs.layoutLR' },
];

export const Legend: React.FC<LegendProps> = ({
  legendItems,
  colorBy,
  onColorByChange,
  labelKey,
  availableLabelKeys,
  onLabelKeyChange,
  layoutDirection,
  onLayoutDirectionChange,
}) => {
  const { t } = useTranslation();
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const colorButtonId = useId();

  return (
    <div className={styles.legendWrapper}>
      <div className={styles.legendContainer}>
        {colorBy === 'label' && labelKey && (
          <div className={styles.legendRow}>
            <span style={{ fontWeight: 600 }}>{labelKey}</span>
          </div>
        )}
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
              {COLOR_BY_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  design={colorBy === opt.value ? 'Emphasized' : 'Default'}
                  onClick={() => {
                    onColorByChange(opt.value);
                    if (!opt.keepOpen) setColorPopoverOpen(false);
                  }}
                >
                  {t(opt.i18nKey)}
                </Button>
              ))}
            </div>
            {colorBy === 'label' && availableLabelKeys && availableLabelKeys.length > 0 && (
              <div className={styles.popoverButtonContainer} style={{ marginTop: 8 }}>
                <Select
                  onChange={(e) => {
                    const v = (e.detail.selectedOption as HTMLElement | null)?.dataset?.value;
                    onLabelKeyChange?.(v);
                  }}
                >
                  {availableLabelKeys.map((k) => (
                    <Option key={k} data-value={k} selected={k === labelKey}>
                      {k}
                    </Option>
                  ))}
                </Select>
              </div>
            )}
            {onLayoutDirectionChange && layoutDirection && (
              <>
                <h4 className={styles.popoverHeader} style={{ marginTop: 12 }}>
                  {t('Graphs.layoutDirection')}
                </h4>
                <div className={styles.popoverButtonContainer}>
                  {LAYOUT_DIRECTION_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      design={layoutDirection === opt.value ? 'Emphasized' : 'Default'}
                      onClick={() => onLayoutDirectionChange(opt.value)}
                    >
                      {t(opt.i18nKey)}
                    </Button>
                  ))}
                </div>
              </>
            )}
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

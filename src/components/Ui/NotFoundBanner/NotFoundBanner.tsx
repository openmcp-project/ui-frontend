import { IllustratedBanner } from '../IllustratedBanner/IllustratedBanner.tsx';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { Trans, useTranslation } from 'react-i18next';

import styles from './NotFoundBanner.module.css';
import { Button } from '@ui5/webcomponents-react';
import { useNavigate } from 'react-router-dom';

export interface NotFoundBannerProps {
  entityType: string;
}
export function NotFoundBanner({ entityType }: NotFoundBannerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <IllustratedBanner
      illustrationName={IllustrationMessageType.PageNotFound}
      title={t('NotFoundBanner.titleMessage', { entityType })}
      subtitle={
        <div className={styles.subtitleContainer}>
          <span>
            <Trans i18nKey="NotFoundBanner.subtitleMessage" values={{ entityType }} />
          </span>
          <Button className={styles.button} onClick={() => navigate('/')}>
            {t('NotFoundBanner.navigateHome')}
          </Button>
        </div>
      }
    />
  );
}

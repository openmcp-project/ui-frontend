import { useTranslation } from 'react-i18next';
import { useId, useState } from 'react';
import { Button, Link, ResponsivePopover, Text } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useFrontendConfig } from '../../../context/FrontendConfigContext';
import styles from './DeprecatedLabel.module.css';

export const DeprecatedLabel = () => {
  const { t } = useTranslation();
  const buttonId = useId();
  const [open, setOpen] = useState(false);
  const { mcp2DocsUrl } = useFrontendConfig();
  const handleClick = () => {
    setOpen((prev) => !prev);
  };

  return (
    <>
      <Button id={buttonId} icon={'message-warning'} className={styles.label} onClick={handleClick}>
        {t('common.deprecated')}
      </Button>
      <ResponsivePopover
        opener={buttonId}
        open={open}
        placement={PopoverPlacement.Bottom}
        onClose={() => setOpen(false)}
      >
        <div className={styles.popoverContent}>
          <Text>{t('deprecated.deprecatedPopoverMessage')}</Text>
          {mcp2DocsUrl && (
            <Link href={mcp2DocsUrl} target="_blank" rel="noopener noreferrer">
              {t('common.readMore')}
            </Link>
          )}
        </div>
      </ResponsivePopover>
    </>
  );
};

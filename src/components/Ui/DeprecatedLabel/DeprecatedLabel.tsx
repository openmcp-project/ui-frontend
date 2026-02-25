import { useTranslation } from 'react-i18next';
import { useId, useState } from 'react';
import { Button, Link, ResponsivePopover, Text } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import styles from './DeprecatedLabel.module.css';

export const DeprecatedLabel = () => {
  const { t } = useTranslation();
  const buttonId = useId();
  const [open, setOpen] = useState(false);
  const docsUrl = import.meta.env.VITE_MCP2_DOCS_URL;
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
          {docsUrl && (
            <Link href={docsUrl} target="_blank" rel="noopener noreferrer">
              {t('common.readMore')}
            </Link>
          )}
        </div>
      </ResponsivePopover>
    </>
  );
};

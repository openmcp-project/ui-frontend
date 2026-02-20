import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import { Button, ButtonDomRef, Link, PopoverDomRef, ResponsivePopover, Text } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import styles from './DeprecatedLabel.module.css';

export const DeprecatedLabel = () => {
  const { t } = useTranslation();
  const popoverRef = useRef<PopoverDomRef>(null);
  const spanRef = useRef<ButtonDomRef>(null);
  const [open, setOpen] = useState(false);
  const docsUrl = import.meta.env.VITE_MCP2_DOCS_URL;
  const handleClick = () => {
    if (popoverRef.current) {
      (popoverRef.current as unknown as { opener: EventTarget | null }).opener = spanRef.current;
      setOpen((prev) => !prev);
    }
  };

  return (
    <>
      <Button ref={spanRef} icon={'message-warning'} className={styles.label} onClick={handleClick}>
        {t('common.deprecated')}
      </Button>
      <ResponsivePopover
        ref={popoverRef}
        open={open}
        placement={PopoverPlacement.Bottom}
        onClose={() => setOpen(false)}
      >
        <div className={styles.popoverContent}>
          <Text>{t('deprecated.deprecatedPopoverMessage')}</Text>
          {docsUrl && (
            <Link href={docsUrl} target="_blank">
              {t('common.readMore')}
            </Link>
          )}
        </div>
      </ResponsivePopover>
    </>
  );
};

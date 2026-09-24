import '@ui5/webcomponents-icons/dist/sys-help';
import { Icon, Popover } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Tooltip.module.css';

interface TooltipProps {
  text: string;
}

export function Tooltip({ text }: TooltipProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const triggerId = `tooltip-${useId().replace(/:/g, '')}`;

  const handleOpen = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      clearTimeout(closeTimer.current);
      setOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <>
      <span
        id={triggerId}
        role="button"
        tabIndex={0}
        aria-label={t('common.helpButtonLabel')}
        className={styles.trigger}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        onClick={() => {
          clearTimeout(closeTimer.current);
          setOpen((prev) => !prev);
        }}
        onKeyDown={handleKeyDown}
      >
        <Icon
          name="sys-help"
          style={{ color: 'var(--sapContent_NonInteractiveIconColor)', height: '0.75rem', width: '0.75rem' }}
        />
      </span>
      <Popover
        opener={triggerId}
        open={open}
        placement={PopoverPlacement.Bottom}
        preventInitialFocus
        accessibleRole="None"
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onClose={() => setOpen(false)}
      >
        <div className={styles.content}>{text}</div>
      </Popover>
    </>
  );
}

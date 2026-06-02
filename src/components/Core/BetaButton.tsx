import { PopoverDomRef, Popover, Text } from '@ui5/webcomponents-react';
import { useState, useRef, RefObject } from 'react';
import styles from './ShellBar.module.css';
import { useTranslation } from 'react-i18next';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { ThemingParameters } from '@ui5/webcomponents-react-base';

export function BetaButton() {
  const [betaPopoverOpen, setBetaPopoverOpen] = useState(false);
  const betaButtonRef = useRef<HTMLButtonElement>(null);
  const betaPopoverRef = useRef<PopoverDomRef>(null);
  const { t } = useTranslation();

  const onBetaClick = () => {
    if (!betaButtonRef.current || !betaPopoverRef.current) return;
    betaPopoverRef.current.opener = betaButtonRef.current;
    setBetaPopoverOpen(!betaPopoverOpen);
  };

  return (
    <>
      <button
        ref={betaButtonRef}
        className={styles.betaBadge}
        slot="content"
        aria-label={t('ShellBar.betaButtonAriaLabel')}
        aria-haspopup="dialog"
        aria-expanded={betaPopoverOpen}
        onClick={onBetaClick}
      >
        {t('ShellBar.betaButton')}
      </button>
      <BetaPopover open={betaPopoverOpen} setOpen={setBetaPopoverOpen} popoverRef={betaPopoverRef} />
    </>
  );
}

const BetaPopover = ({
  open,
  setOpen,
  popoverRef,
}: {
  open: boolean;
  setOpen: (arg0: boolean) => void;
  popoverRef: RefObject<PopoverDomRef | null>;
}) => {
  const { t } = useTranslation();

  return (
    <Popover ref={popoverRef} placement={PopoverPlacement.Bottom} open={open} onClose={() => setOpen(false)}>
      <Text
        style={{
          padding: '1rem',
          maxWidth: '250px',
          fontFamily: ThemingParameters.sapFontFamily,
        }}
      >
        {t('ShellBar.betaButtonDescription')}
      </Text>
    </Popover>
  );
};

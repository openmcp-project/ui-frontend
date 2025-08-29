import { ButtonDomRef, Button, Icon, PopoverDomRef, Popover, Text } from "@ui5/webcomponents-react";
import { useState, useRef, RefObject } from "react";
import styles from './ShellBar.module.css';
import { useTranslation } from "react-i18next";
import PopoverPlacement from "@ui5/webcomponents/dist/types/PopoverPlacement.js";
import { ThemingParameters } from '@ui5/webcomponents-react-base';


export function BetaButton() {
  const [betaPopoverOpen, setBetaPopoverOpen] = useState(false);
  const betaButtonRef = useRef<ButtonDomRef>(null);
  const betaPopoverRef = useRef<PopoverDomRef>(null);
  const { t } = useTranslation();


  const onBetaClick = () => {
    if (betaButtonRef.current) {
      betaPopoverRef.current!.opener = betaButtonRef.current;
      setBetaPopoverOpen(!betaPopoverOpen);
    }
  };

  return (
    <>
      <Button ref={betaButtonRef} className={styles.betaButton} onClick={onBetaClick}>
        <span className={styles.betaContent}>
          <Icon name="information" className={styles.betaIcon} />
          <span className={styles.betaText}>{t('ShellBar.betaButton')}</span>
        </span>
        <BetaPopover open={betaPopoverOpen} setOpen={setBetaPopoverOpen} popoverRef={betaPopoverRef} />
      </Button>
    </>
  )
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


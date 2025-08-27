import { Button, ButtonDomRef, FlexBox, Icon, ResponsivePopover, Text } from '@ui5/webcomponents-react';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import { useRef, useState } from 'react';
import { AnimatedHoverTextButton } from '../Helper/AnimatedHoverTextButton.tsx';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import styles from './ResourceStatusCell.module.css';
export interface ResourceStatusCellProps {
  isOk: boolean;
  transitionTime: string;
  message?: string;
  positiveText: string;
  negativeText: string;
  hideOnHoverEffect?: boolean;
}
export const ResourceStatusCell = ({
  isOk,
  transitionTime,
  message,
  positiveText,
  negativeText,
  hideOnHoverEffect,
}: ResourceStatusCellProps) => {
  const btnRef = useRef<ButtonDomRef>(null);
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
  const timeAgo = transitionTime ? formatDateAsTimeAgo(transitionTime) : '-';

  const handleClose = () => {
    setPopoverIsOpen(false);
  };
  const handleOpen = () => {
    setPopoverIsOpen(true);
  };
  return (
    <span>
      {hideOnHoverEffect ? (
        <Button ref={btnRef} design="Transparent" title={timeAgo} aria-label={timeAgo} onClick={handleOpen}>
          <Icon
            design={isOk ? 'Positive' : 'Negative'}
            name={isOk ? 'sys-enter-2' : 'sys-cancel-2'}
            showTooltip={true}
            accessibleName={timeAgo}
          />
        </Button>
      ) : (
        <AnimatedHoverTextButton
          ref={btnRef}
          icon={
            <Icon
              design={isOk ? 'Positive' : 'Negative'}
              name={isOk ? 'sys-enter-2' : 'sys-cancel-2'}
              showTooltip={true}
              accessibleName={timeAgo}
            />
          }
          text={isOk ? positiveText : negativeText}
          onClick={handleOpen}
        />
      )}

      <ResponsivePopover
        opener={btnRef.current ?? undefined}
        open={popoverIsOpen}
        placement={PopoverPlacement.Bottom}
        onClose={handleClose}
      >
        <Text className={styles.message}>{message}</Text>

        <FlexBox className={styles.wrapper} justifyContent={'Start'} alignItems={'Center'} gap={12}>
          <Icon
            name={'date-time'}
            style={{
              color: isOk ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)',
            }}
            design={isOk ? 'Positive' : 'Negative'}
          />
          <Text
            className={styles.subheader}
            style={{
              color: isOk ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)',
            }}
          >
            {timeAgo}
          </Text>
        </FlexBox>
      </ResponsivePopover>
    </span>
  );
};

import { ButtonDomRef, FlexBox, Icon, ResponsivePopover, Text } from '@ui5/webcomponents-react';
import { timeAgo } from '../../utils/i18n/timeAgo';
import { RefObject, useRef, useState } from 'react';
import { AnimatedHoverTextButton } from '../Helper/AnimatedHoverTextButton.tsx';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import styles from './ResourceStatusCell.module.css';
export interface ResourceStatusCellProps {
  isOk: boolean;
  transitionTime: string;
  message?: string;
  positiveText: string;
  negativeText: string;
}
export const ResourceStatusCell = ({
  isOk,
  transitionTime,
  message,
  positiveText,
  negativeText,
}: ResourceStatusCellProps) => {
  const btnRef = useRef<ButtonDomRef>(null);
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);

  const handleClose = () => {
    setPopoverIsOpen(false);
  };

  return (
    <span>
      <AnimatedHoverTextButton
        ref={btnRef}
        icon={
          <Icon
            design={isOk ? 'Positive' : 'Negative'}
            name={isOk ? 'sys-enter-2' : 'sys-cancel-2'}
            showTooltip={true}
            accessibleName={transitionTime ? timeAgo.format(new Date(transitionTime)) : '-'}
          />
        }
        text={isOk ? positiveText : negativeText}
      />
      <ResponsivePopover
        opener={btnRef.current}
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
            {timeAgo.format(new Date(transitionTime))}
          </Text>
        </FlexBox>
      </ResponsivePopover>
    </span>
  );
};

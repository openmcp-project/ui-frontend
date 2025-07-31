import { FlexBox, Icon, PopoverDomRef, ResponsivePopover, Text } from '@ui5/webcomponents-react';
import { timeAgo } from '../../utils/i18n/timeAgo';
import { MouseEvent, useRef, useState } from 'react';
import { AnimatedHoverTextButton } from '../Helper/AnimatedHoverTextButton.tsx';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';

export interface StatusCellProps {
  value: boolean;
  transitionTime: string;
  message?: string;
  positiveText: string;
  negativeText: string;
}
export const ResourceStatusCellWithButton = ({
  value,
  transitionTime,
  message,
  positiveText,
  negativeText,
}: StatusCellProps) => {
  const popoverRef = useRef<PopoverDomRef>(null);
  const [open, setOpen] = useState(false);

  const handleOpenerClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (popoverRef.current) {
      (popoverRef.current as unknown as { opener: EventTarget | null }).opener = e.target;
      setOpen((prev) => !prev);
    }
  };

  return (
    <span>
      <AnimatedHoverTextButton
        icon={
          <Icon
            design={value ? 'Positive' : 'Negative'}
            name={value ? 'sys-enter-2' : 'sys-cancel-2'}
            showTooltip={true}
            accessibleName={transitionTime ? timeAgo.format(new Date(transitionTime)) : '-'}
          />
        }
        text={value ? positiveText : negativeText}
        onClick={handleOpenerClick}
      />
      <ResponsivePopover ref={popoverRef} open={open} placement={PopoverPlacement.Bottom}>
        <Text
          style={{
            maxWidth: '60ch',
            textAlign: 'left',
            lineHeight: '1.5em',
            color: value ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)',
          }}
        >
          {message}
        </Text>

        <FlexBox
          style={{ borderTop: '1px solid gray', paddingTop: '1rem', marginTop: '1rem' }}
          justifyContent={'Start'}
          alignItems={'Center'}
          gap={16}
        >
          <Icon name={'date-time'} />
          <Text style={{ maxWidth: '60ch', textAlign: 'left', lineHeight: '1.5em', fontWeight: 'bold' }}>
            {timeAgo.format(new Date(transitionTime))}
          </Text>
        </FlexBox>
      </ResponsivePopover>
    </span>
  );
};

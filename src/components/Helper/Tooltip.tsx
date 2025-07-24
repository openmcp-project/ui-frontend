import { Popover } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import React, { useRef, useState } from 'react';

interface TooltipProps {
  tooltipContent: React.ReactNode;
  children: React.ReactNode;
}

export function Tooltip(props: TooltipProps) {
  const openerRef = useRef(null);
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);

  const handleMouseEnter = () => {
    setPopoverIsOpen(true);
  };

  const handleMouseLeave = () => {
    setPopoverIsOpen(false);
  };

  return (
    <>
      <div ref={openerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {props.children}
        <Popover
          opener={openerRef.current!}
          placement={PopoverPlacement.Bottom}
          open={popoverIsOpen}
          onClose={() => {
            setPopoverIsOpen(false);
          }}
        >
          {props.tooltipContent}
        </Popover>
      </div>
    </>
  );
}

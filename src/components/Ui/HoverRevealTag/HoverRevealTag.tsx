import '@ui5/webcomponents-icons/dist/question-mark';
import { Icon, Tag } from '@ui5/webcomponents-react';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';

interface HoverRevealTagProps {
  copy: string;
  icon?: string;
  delay?: number;
  id?: string;
  colorScheme?: ComponentProps<typeof Tag>['colorScheme'];
  design?: ComponentProps<typeof Tag>['design'];
  className?: string;
  onClick?: () => void;
}

export function HoverRevealTag({
  copy,
  icon = 'question-mark',
  delay = 500,
  id,
  colorScheme,
  design,
  className,
  onClick,
}: HoverRevealTagProps) {
  const [isHinted, setIsHinted] = useState(false);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHinted(true);
  };

  const handleLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => setIsHinted(false), delay);
  };

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current !== null) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Tag
      className={className}
      colorScheme={colorScheme}
      design={design}
      id={id}
      interactive
      onBlur={handleLeave}
      onClick={onClick}
      onFocus={handleEnter}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {!isHinted && <Icon name={icon} slot="icon" />}
      {isHinted ? copy : undefined}
    </Tag>
  );
}

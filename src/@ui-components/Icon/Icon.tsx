import IconPaths from './IconPaths.ts';

import classes from './Icon.module.css';
import clsx from 'clsx';

export interface IconProps {
  src: keyof typeof IconPaths;
  design?: 'neutral' | 'positive' | 'negative' | 'warning';
  alt?: string;
  className?: string;
}

export function Icon({ design = 'neutral', src, alt, className }: IconProps) {
  return (
    <svg
      className={clsx(classes.svg, className)}
      viewBox="0 0 512 512"
      role="presentation"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      data-mcp-icon-design={design}
      aria-label={alt}
    >
      <g role="presentation">
        <path d={IconPaths[src]?.path} />
      </g>
    </svg>
  );
}

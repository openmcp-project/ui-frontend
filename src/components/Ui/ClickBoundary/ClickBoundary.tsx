import type { PropsWithChildren, ReactNode } from 'react';

export interface ClickBoundaryProps extends PropsWithChildren {
  'data-cy': string;
}

/**
 * Wraps children in a click-event boundary: stops a click from bubbling past this element to a
 * clickable ancestor (e.g. a `Card` with its own `onClick`), without introducing a new
 * interactive control of its own - the actual interactive element(s) are the children.
 * Must stay a bubble-phase `onClick` (not `onClickCapture`): capture-phase stopPropagation on an
 * ancestor would stop the event before it ever reaches the interactive child, so the child's own
 * click handler would never fire.
 */
export function ClickBoundary({ children, 'data-cy': dataCy }: ClickBoundaryProps): ReactNode {
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- this span is an event boundary, not a new interactive control; the actual interactive element(s) is/are the children it wraps
    <span data-cy={dataCy} onClick={(e) => e.stopPropagation()}>
      {children}
    </span>
  );
}

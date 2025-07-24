import React from 'react';

interface TooltipCellProps {
  children: React.ReactNode;
  title?: string;
}

const TooltipCell: React.FC<TooltipCellProps> = ({ children, title }) => {
  const resolvedTitle = typeof children === 'string' || typeof children === 'number' ? String(children) : (title ?? '');

  return (
    <div
      title={resolvedTitle}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
        }}
      >
        {children}
      </span>
    </div>
  );
};

export default TooltipCell;

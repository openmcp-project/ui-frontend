import { Icon } from '@ui5/webcomponents-react';
import { StatusCellProps } from '../../lib/shared/interfaces';
import { timeAgo } from '../../utils/i18n/timeAgo';

export function ResourceStatusCell({ value, transitionTime }: StatusCellProps) {
  console.log('transitionTime');
  console.log(transitionTime);
  return (
    <Icon
      design={value ? 'Positive' : 'Negative'}
      name={value ? 'sys-enter-2' : 'sys-cancel-2'}
      showTooltip={true}
      accessibleName={
        transitionTime ? timeAgo.format(new Date(transitionTime)) : '-'
      }
    />
  );
}

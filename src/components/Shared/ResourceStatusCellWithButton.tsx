import { Icon } from '@ui5/webcomponents-react';
import { timeAgo } from '../../utils/i18n/timeAgo';
export interface StatusCellProps {
  value: boolean;
  transitionTime: string;
  errorMessage?: string;
}

export const ResourceStatusCellWithButton = ({ value, transitionTime, errorMessage }: StatusCellProps) => {
  // if (!value) {
  console.log(errorMessage);
  // }
  alert(errorMessage);
  return (
    <Icon
      design={value ? 'Positive' : 'Negative'}
      name={value ? 'sys-enter-2' : 'sys-cancel-2'}
      showTooltip={true}
      accessibleName={transitionTime ? timeAgo.format(new Date(transitionTime)) : '-'}
    />
  );
};

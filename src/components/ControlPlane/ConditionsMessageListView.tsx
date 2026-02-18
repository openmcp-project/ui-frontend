import { MessageView, MessageItem } from '@ui5/webcomponents-react';
import { ControlPlaneStatusCondition } from '../../lib/api/types/crate/controlPlanes';
import { ConditionMessageItem } from './ConditionMessageItem.tsx';
import styles from './MCPHealthPopoverButton.module.css';

type ConditionsMessageListViewProps = {
  conditions: ControlPlaneStatusCondition[] | undefined;
};

export const ConditionsMessageListView = ({ conditions }: ConditionsMessageListViewProps) => {
  const sortedConditions = conditions ? [...conditions].sort((a, b) => (a.type < b.type ? -1 : 1)) : [];

  return (
    <div>
      <div className={styles.statusTable}>
        <MessageView showDetailsPageHeader={true}>
          {sortedConditions.map((condition, index) => (
            <MessageItem
              key={`${condition.type}-${index}`}
              type={condition.status === 'True' ? 'Positive' : 'Negative'}
              titleText={condition.type}
              subtitleText={condition.reason || ''}
            >
              <ConditionMessageItem condition={condition} />
            </MessageItem>
          ))}
        </MessageView>
      </div>
    </div>
  );
};

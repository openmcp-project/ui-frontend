import { Condition } from '../../lib/shared/types.ts';
import { MessageItem, MessageView } from '@ui5/webcomponents-react';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo.ts';

export interface ConditionsProps {
  conditions: Condition[];
}

export function Conditions({ conditions }: ConditionsProps) {
  return (
    <MessageView showDetailsPageHeader={true}>
      {conditions.map((condition, index) => (
        <MessageItem
          key={index}
          style={{ textAlign: 'left' }}
          type={condition.status === 'True' ? 'Positive' : 'Negative'}
          titleText={
            condition.type + ': ' + condition.reason + ' [' + formatDateAsTimeAgo(condition.lastTransitionTime) + ']'
          }
          subtitleText={condition.message}
          tooltip={
            condition.message +
            ' [' +
            formatDateAsTimeAgo(condition.lastTransitionTime) +
            ' – ' +
            condition.lastTransitionTime +
            ']'
          }
        />
      ))}
    </MessageView>
  );
}

import { Condition } from '../../lib/shared/types.ts';
import { MessageItem, MessageView, Text } from '@ui5/webcomponents-react';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo.ts';
import { CopyButton } from '../Shared/CopyButton.tsx';

export interface ConditionsProps {
  conditions: Condition[];
}

export function Conditions({ conditions }: ConditionsProps) {
  return (
    <MessageView
      showDetailsPageHeader={true}
      onItemSelect={(e) => {
        // TODO: Manually perform the navigation in the popover as described in the UI5 docs
      }}
    >
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
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 8px' }}>
            <span>Type</span>
            <Text>{condition.type}</Text>

            <span>Status</span>
            <Text>{condition.status}</Text>

            <span>Last Transition</span>
            <Text>{condition.lastTransitionTime}</Text>

            <span>Reason</span>
            <Text>{condition.reason}</Text>

            <span>Message</span>
            <Text>{condition.message}</Text>
          </div>

          <CopyButton style={{ marginTop: '16px' }} text={'Copy'} />
        </MessageItem>
      ))}
    </MessageView>
  );
}

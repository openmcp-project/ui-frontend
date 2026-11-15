import { Icon, FlexBox, Text } from '@ui5/webcomponents-react';
import { useMemo } from 'react';
import ReactTimeAgo from 'react-time-ago';
import { useTranslation } from 'react-i18next';

import type { ControlPlaneStatusCondition } from '../../lib/api/types/crate/controlPlanes';
import styles from './ConditionMessageItem.module.css';
import { YamlBlock } from '../Yaml/YamlBlock.tsx';
import { stringify } from 'yaml';

type ConditionMessageItemProps = {
  condition: ControlPlaneStatusCondition;
};

export const ConditionMessageItem = ({ condition }: ConditionMessageItemProps) => {
  const { t } = useTranslation();

  const date = condition.lastTransitionTime ? new Date(condition.lastTransitionTime) : null;
  const isValidDate = date !== null && !isNaN(date.getTime());
  const isOk = condition.status === 'True';

  const stringifiedCondition = useMemo(() => stringify(condition, { indent: 2 }), [condition]);

  return (
    <FlexBox direction="Column" className={styles.conditionContent}>
      <div>
        <div className={styles.yamlViewer}>
          <YamlBlock value={stringifiedCondition} filename="condition" size={240} actions={['copy']} />
        </div>

        <FlexBox justifyContent={'Start'} alignItems={'Center'} gap={12}>
          <Icon
            name={'date-time'}
            style={{
              color: isOk ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)',
            }}
            design={isOk ? 'Positive' : 'Negative'}
          />
          <Text
            style={{
              color: isOk ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)',
            }}
          >
            {isValidDate ? <ReactTimeAgo date={date} /> : t('common.unknown', 'Unknown')}
          </Text>
        </FlexBox>
      </div>
    </FlexBox>
  );
};

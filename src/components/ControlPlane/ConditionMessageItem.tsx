import { Icon, FlexBox, Toolbar, ToolbarButton, Text } from '@ui5/webcomponents-react';
import { useMemo } from 'react';
import ReactTimeAgo from 'react-time-ago';
import { useTranslation } from 'react-i18next';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';

import type { ControlPlaneStatusCondition } from '../../lib/api/types/crate/controlPlanes';
import styles from './ConditionMessageItem.module.css';
import { YamlEditor } from '../YamlEditor/YamlEditor.tsx';
import { stringify } from 'yaml';

type ConditionMessageItemProps = {
  condition: ControlPlaneStatusCondition;
};

export const ConditionMessageItem = ({ condition }: ConditionMessageItemProps) => {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();

  const date = condition.lastTransitionTime ? new Date(condition.lastTransitionTime) : new Date();
  const isValidDate = !isNaN(date.getTime());
  const isOk = condition.status === 'True';

  const stringifiedCondition = useMemo(() => stringify(condition, { indent: 2 }), [condition]);

  return (
    <FlexBox direction="Column" className={styles.conditionContent}>
      <div>
        <div className={styles.yamlViewer}>
          <Toolbar alignContent="Start">
            <ToolbarButton
              design="Transparent"
              icon="copy"
              text={t('buttons.copy')}
              onClick={() => copyToClipboard(stringifiedCondition)}
            />
          </Toolbar>
          <div className={styles.yamlContainer}>
            <YamlEditor value={stringifiedCondition} isEdit={false} />
          </div>
        </div>

        <FlexBox justifyContent={'Start'} alignItems={'Center'} gap={12} className={styles.subheader}>
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

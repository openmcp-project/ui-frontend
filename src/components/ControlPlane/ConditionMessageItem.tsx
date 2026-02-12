import { Icon, FlexBox, Toolbar, ToolbarButton, Text } from '@ui5/webcomponents-react';

import ReactTimeAgo from 'react-time-ago';
import { useTranslation } from 'react-i18next';
import { YamlViewer } from '../Yaml/YamlViewer.tsx';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { Infobox } from '../Ui/Infobox/Infobox.tsx';
import type { ControlPlaneStatusCondition } from '../../lib/api/types/crate/controlPlanes';
import styles from './MCPHealthPopoverButton.module.css';

type ConditionMessageItemProps = {
  condition: ControlPlaneStatusCondition;
};

export const ConditionMessageItem = ({ condition }: ConditionMessageItemProps) => {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();

  const date = new Date(condition.lastTransitionTime);
  const isOk = condition.status === 'True';

  return (
    <FlexBox direction="Column" className={styles.conditionContent}>
      <div>
        {condition.message && (
          <Infobox>
            <Text>{condition.message}</Text>
          </Infobox>
        )}

        <FlexBox justifyContent={'Start'} alignItems={'Center'} gap={12}>
          <Icon
            name={'date-time'}
            style={{
              color: isOk ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)',
            }}
            design={isOk ? 'Positive' : 'Negative'}
          />
          <Text
            className={styles.subheader}
            style={{
              color: isOk ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)',
            }}
          >
            <ReactTimeAgo date={date} />
          </Text>
        </FlexBox>
      </div>
      <div className={styles.yamlViewer}>
        <Toolbar>
          <ToolbarButton
            design="Transparent"
            icon="copy"
            text={t('buttons.copy')}
            onClick={() => copyToClipboard(JSON.stringify(condition, null, 2))}
          />
        </Toolbar>
        <YamlViewer yamlString={JSON.stringify(condition, null, 2)} filename={`${condition.type}.yaml`} />
      </div>
    </FlexBox>
  );
};

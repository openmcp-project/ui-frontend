import { Grid, List, ListItemStandard, Title } from '@ui5/webcomponents-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { buildMcpV2GraphQLInput } from '../../../spaces/mcp/hooks/useCreateManagedControlPlaneV2GraphQL.ts';
import { McpV2Input } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { parseResourceApiInfo } from '../../../utils/parseResourceApiInfo.ts';
import { Resource } from '../../../utils/removeManagedFieldsAndFilterData.ts';
import styles from './SummarizeStep.module.css';
import YamlSummarize from './YamlSummarize.tsx';

interface SummarizeStepProps {
  rawInput: McpV2Input;
}

export const SummarizeStepV2: React.FC<SummarizeStepProps> = ({ rawInput }) => {
  const { t } = useTranslation();

  const { yamlString, apiGroupName, apiVersion } = useMemo(() => {
    const res = buildMcpV2GraphQLInput(rawInput);
    return {
      yamlString: stringify(res),
      ...parseResourceApiInfo(res as unknown as Resource),
    };
  }, [rawInput]);

  return (
    <div className={styles.wrapper}>
      <Title>{t('common.summarize')}</Title>
      <Grid defaultSpan="XL6 L6 M6 S6">
        <div>
          <List headerText={t('common.metadata')}>
            <ListItemStandard text={t('common.name')} additionalText={rawInput.name} />
            <ListItemStandard text={t('common.namespace')} additionalText={rawInput.namespace} />
          </List>
          <br />
          <List headerText={t('common.members')}>
            {rawInput.roleBindings
              .flatMap((rb) =>
                rb.subjects.map((subject) => ({
                  ...subject,
                  role: rb.roleRefs[0]?.name ?? '',
                })),
              )
              .map((subject) => (
                <ListItemStandard
                  key={`${subject.kind}:${subject.name}:${subject.role}`}
                  text={subject.name}
                  additionalText={`${subject.kind} · ${subject.role}`}
                />
              ))}
          </List>
        </div>
        <div>
          <YamlSummarize
            yamlString={yamlString}
            filename={`mcp_${rawInput.namespace}_${rawInput.name}`}
            apiVersion={apiVersion}
            apiGroupName={apiGroupName}
          />
        </div>
      </Grid>
    </div>
  );
};

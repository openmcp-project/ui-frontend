import { Grid, List, ListItemStandard } from '@ui5/webcomponents-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { buildMcpV2GraphQLInput } from '../../../spaces/controlPlaneV2/helpers/controlPlaneV2GraphQLInput.ts';
import { McpV2Input, ServiceSelection } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { parseResourceApiInfo } from '../../../utils/parseResourceApiInfo.ts';
import { Resource } from '../../../utils/removeManagedFieldsAndFilterData.ts';
import styles from '../CreateManagedControlPlane/SummarizeStep.module.css';
import YamlSummarize from '../CreateManagedControlPlane/YamlSummarize.tsx';

interface SummarizeStepProps {
  rawInput: McpV2Input;
  services?: ServiceSelection;
}

export const SummarizeStepV2: React.FC<SummarizeStepProps> = ({ rawInput, services }) => {
  const { t } = useTranslation();

  const { yamlString, apiGroupName, apiVersion } = useMemo(() => {
    const res = buildMcpV2GraphQLInput(rawInput);
    return {
      yamlString: stringify(res),
      ...parseResourceApiInfo(res as unknown as Resource),
    };
  }, [rawInput]);

  const selectedServices = useMemo(() => {
    if (!services) return [];
    return [
      { key: 'crossplane', label: t('ServiceSelectionStep.crossplane'), entry: services.crossplane },
      { key: 'flux', label: t('ServiceSelectionStep.flux'), entry: services.flux },
      { key: 'landscaper', label: t('ServiceSelectionStep.landscaper'), entry: services.landscaper },
      {
        key: 'externalSecretsOperator',
        label: t('ServiceSelectionStep.externalSecretsOperator'),
        entry: services.externalSecretsOperator,
      },
    ].filter((s) => s.entry?.selected);
  }, [services, t]);

  return (
    <div className={styles.wrapper}>
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
          {selectedServices.length > 0 && (
            <>
              <br />
              <List headerText={t('ServiceSelectionStep.stepTitle')}>
                {selectedServices.map(({ key, label, entry }) => (
                  <ListItemStandard
                    key={key}
                    text={label}
                    additionalText={entry?.version || t('ServiceSelectionStep.versionPlaceholder')}
                  />
                ))}
              </List>
              {!!services?.crossplane?.selected && services.crossplane.providers?.length ? (
                <>
                  <br />
                  <List headerText={t('ComponentInstallDialog.providers')}>
                    {services.crossplane.providers.map((provider) => (
                      <ListItemStandard
                        key={provider.name}
                        text={provider.name}
                        additionalText={provider.version || t('ServiceSelectionStep.versionPlaceholder')}
                      />
                    ))}
                  </List>
                </>
              ) : null}
            </>
          )}
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

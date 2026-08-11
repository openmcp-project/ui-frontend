import { Grid, List, ListItemStandard } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/decline.js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { buildMcpV2GraphQLInput } from '../../../spaces/controlPlaneV2/helpers/controlPlaneV2GraphQLInput.ts';
import { McpV2Input, ServiceSelection } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import {
  resolveServiceMutationAction,
  ServiceMutationAction,
} from '../../../spaces/mcp/utils/resolveServiceMutationAction.ts';
import { parseResourceApiInfo } from '../../../utils/parseResourceApiInfo.ts';
import { Resource } from '../../../utils/removeManagedFieldsAndFilterData.ts';
import styles from '../CreateManagedControlPlane/SummarizeStep.module.css';
import { YamlDiff } from '../CreateManagedControlPlane/YamlDiff.tsx';
import YamlSummarize from '../CreateManagedControlPlane/YamlSummarize.tsx';

interface InitialServiceState {
  crossplane: boolean;
  flux: boolean;
  landscaper: boolean;
  externalSecretsOperator: boolean;
  ocm: boolean;
  kro: boolean;
}

interface SummarizeStepProps {
  rawInput: McpV2Input;
  services?: ServiceSelection;
  isEditMode?: boolean;
  originalYamlString?: string;
  initialServices?: InitialServiceState;
  initialCrossplaneProviders?: string[];
}

type ValueState = 'Positive' | 'Negative' | 'None';

function actionToState(action: ServiceMutationAction): ValueState {
  if (action === 'create') return 'Positive';
  if (action === 'delete') return 'Negative';
  return 'None';
}

function actionToClassName(action: ServiceMutationAction): string | undefined {
  if (action === 'create') return styles.addedItem;
  if (action === 'delete') return styles.removedItem;
  return undefined;
}

function actionToIcon(action: ServiceMutationAction): string | undefined {
  if (action === 'create') return 'add';
  if (action === 'delete') return 'decline';
  return undefined;
}

export const SummarizeStepV2: React.FC<SummarizeStepProps> = ({
  rawInput,
  services,
  isEditMode = false,
  originalYamlString = '',
  initialServices,
  initialCrossplaneProviders,
}) => {
  const { t } = useTranslation();

  const { yamlString, apiGroupName, apiVersion } = useMemo(() => {
    const res = buildMcpV2GraphQLInput(rawInput);
    return {
      yamlString: stringify(res),
      ...parseResourceApiInfo(res as unknown as Resource),
    };
  }, [rawInput]);

  const defaultMembersHeaderText = t('common.members');

  const serviceEntries = useMemo(() => {
    if (!services) return [];

    const defs = [
      { key: 'crossplane' as const, label: t('ServiceSelectionStep.crossplane') },
      { key: 'flux' as const, label: t('ServiceSelectionStep.flux') },
      { key: 'landscaper' as const, label: t('ServiceSelectionStep.landscaper') },
      { key: 'externalSecretsOperator' as const, label: t('ServiceSelectionStep.externalSecretsOperator') },
      { key: 'ocm' as const, label: t('ServiceSelectionStep.ocm') },
      { key: 'kro' as const, label: t('ServiceSelectionStep.kro') },
    ];

    return defs
      .map(({ key, label }) => {
        const entry = services[key];
        const wasInstalled = initialServices?.[key] ?? false;
        const isSelected = entry?.selected ?? false;
        const action = resolveServiceMutationAction(isEditMode, wasInstalled, isSelected);
        if (action === 'skip') return null;
        return { key, label, entry, action };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [services, initialServices, isEditMode, t]);

  const showProviders = !!services?.crossplane?.selected && !!services.crossplane.providers?.length;

  const removedProviders = useMemo(() => {
    if (!isEditMode || !initialCrossplaneProviders) return [];
    const currentNames = new Set((services?.crossplane?.providers ?? []).map((p) => p.name));
    return initialCrossplaneProviders.filter((name) => !currentNames.has(name));
  }, [isEditMode, initialCrossplaneProviders, services?.crossplane?.providers]);

  return (
    <div className={styles.wrapper}>
      <Grid defaultSpan="XL6 L6 M6 S6">
        <div>
          <List headerText={t('common.metadata')}>
            <ListItemStandard text={t('common.name')} additionalText={rawInput.name} />
            <ListItemStandard text={t('common.namespace')} additionalText={rawInput.namespace} />
          </List>
          <br />
          <List headerText={defaultMembersHeaderText}>
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
          {rawInput.extraProviders.map((provider) => (
            <div key={provider.name}>
              <br />
              <List headerText={provider.name}>
                {provider.roleBindings
                  .flatMap((rb) =>
                    rb.subjects.map((subject) => ({
                      ...subject,
                      role: rb.roleRefs[0]?.name ?? '',
                    })),
                  )
                  .map((subject) => (
                    <ListItemStandard
                      key={`${provider.name}:${subject.kind}:${subject.name}:${subject.role}`}
                      text={subject.name}
                      additionalText={`${subject.kind} · ${subject.role}`}
                    />
                  ))}
              </List>
            </div>
          ))}
          {serviceEntries.length > 0 && (
            <>
              <br />
              <List headerText={t('ServiceSelectionStep.stepTitle')}>
                {serviceEntries.map(({ key, label, entry, action }) => (
                  <ListItemStandard
                    key={key}
                    className={actionToClassName(action)}
                    icon={actionToIcon(action)}
                    text={label}
                    additionalText={entry?.version || t('ServiceSelectionStep.versionPlaceholder')}
                    additionalTextState={actionToState(action)}
                  />
                ))}
              </List>
              {(showProviders || removedProviders.length > 0) && (
                <>
                  <br />
                  <List headerText={t('ComponentInstallDialog.providers')}>
                    {(services?.crossplane?.providers ?? []).map((provider) => {
                      const wasInstalled = initialCrossplaneProviders?.includes(provider.name) ?? false;
                      const action = resolveServiceMutationAction(isEditMode, wasInstalled, true);
                      return (
                        <ListItemStandard
                          key={provider.name}
                          className={actionToClassName(action)}
                          icon={actionToIcon(action)}
                          text={provider.name}
                          additionalText={provider.version || t('ServiceSelectionStep.versionPlaceholder')}
                          additionalTextState={actionToState(action)}
                        />
                      );
                    })}
                    {removedProviders.map((name) => (
                      <ListItemStandard
                        key={`removed-${name}`}
                        className={styles.removedItem}
                        icon="decline"
                        text={name}
                        additionalText={t('ServiceSelectionStep.versionPlaceholder')}
                        additionalTextState="Negative"
                      />
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </div>
        <div>
          {isEditMode ? (
            <YamlDiff originalYaml={originalYamlString} modifiedYaml={yamlString} absolutePosition />
          ) : (
            <YamlSummarize
              yamlString={yamlString}
              filename={`mcp_${rawInput.namespace}_${rawInput.name}`}
              apiVersion={apiVersion}
              apiGroupName={apiGroupName}
            />
          )}
        </div>
      </Grid>
    </div>
  );
};

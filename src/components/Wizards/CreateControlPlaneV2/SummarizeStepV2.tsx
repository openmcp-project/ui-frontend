import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { FlexBox, Label, Text } from '@ui5/webcomponents-react';
import { buildMcpV2GraphQLInput } from '../../../spaces/controlPlaneV2/helpers/controlPlaneV2GraphQLInput.ts';
import { McpV2Input, ServiceSelection } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import LogoCrossplane from '../../../assets/images/logo-crossplane.svg';
import LogoEso from '../../../assets/images/logo-eso.svg';
import LogoFlux from '../../../assets/images/logo-flux.svg';
import LogoLandscaper from '../../../assets/images/logo-landscaper.svg';
import { WizardYamlPreview } from './WizardYamlPreview.tsx';
import styles from './SummarizeStepV2.module.css';
import sharedStyles from '../CreateManagedControlPlane/CreateManagedControlPlaneWizardContainer.module.css';

interface SummarizeStepProps {
  rawInput: McpV2Input;
  isDefaultProviderEnabled?: boolean;
  services?: ServiceSelection;
  servicesYamlString?: string;
}

interface SummaryRow {
  label: string;
  value: string;
  logo?: string;
}

function SummarySection({ title, rows }: { title: string; rows: SummaryRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <Text className={styles.sectionTitle}>{title}</Text>
      <div className={styles.sectionContent}>
        {rows.map(({ label, value, logo }) => (
          <FlexBox key={`${label}-${value}`} justifyContent="SpaceBetween" alignItems="Center" className={styles.row}>
            <FlexBox alignItems="Center" gap={8}>
              {logo && <img src={logo} alt="" className={styles.logo} />}
              <Label>{label}</Label>
            </FlexBox>
            <Text className="mono-font">{value}</Text>
          </FlexBox>
        ))}
      </div>
    </div>
  );
}

const SERVICE_LOGOS: Record<string, string> = {
  crossplane: LogoCrossplane,
  flux: LogoFlux,
  landscaper: LogoLandscaper,
  externalSecretsOperator: LogoEso,
};

const SERVICE_LABELS: Record<string, string> = {
  crossplane: 'ServiceSelectionStep.crossplane',
  flux: 'ServiceSelectionStep.flux',
  landscaper: 'ServiceSelectionStep.landscaper',
  externalSecretsOperator: 'ServiceSelectionStep.externalSecretsOperator',
};

export const SummarizeStepV2: React.FC<SummarizeStepProps> = ({
  rawInput,
  isDefaultProviderEnabled = true,
  services,
  servicesYamlString,
}) => {
  const { t } = useTranslation();

  const yamlString = useMemo(
    () => servicesYamlString ?? stringify(buildMcpV2GraphQLInput(rawInput)),
    [rawInput, servicesYamlString],
  );

  const defaultMemberRows: SummaryRow[] = isDefaultProviderEnabled
    ? rawInput.roleBindings.flatMap((rb) =>
        rb.subjects.map((subject) => ({
          label: subject.name,
          value: `${subject.kind} · ${rb.roleRefs[0]?.name ?? ''}`,
        })),
      )
    : [{ label: t('IdentityProviders.disabledBadge'), value: '' }];

  const selectedServices = useMemo(() => {
    if (!services) return [];
    return Object.entries(SERVICE_LABELS)
      .map(([key, labelKey]) => ({
        key,
        label: t(labelKey),
        logo: SERVICE_LOGOS[key],
        entry: services[key as keyof ServiceSelection],
      }))
      .filter((s) => s.entry?.selected);
  }, [services, t]);

  const serviceRows: SummaryRow[] = selectedServices.map(({ label, logo, entry }) => ({
    label,
    value: entry?.version || t('ServiceSelectionStep.versionPlaceholder'),
    logo,
  }));

  const providerRows: SummaryRow[] =
    services?.crossplane?.selected && services.crossplane.providers?.length
      ? services.crossplane.providers.map((provider) => ({
          label: provider.name,
          value: provider.version || t('ServiceSelectionStep.versionPlaceholder'),
        }))
      : [];

  return (
    <div className={sharedStyles.yamlSplitLayout}>
      <div className={styles.summary}>
        <SummarySection
          title={t('common.metadata')}
          rows={[
            { label: t('common.name'), value: rawInput.name },
            { label: t('common.namespace'), value: rawInput.namespace },
          ]}
        />

        <SummarySection title={t('common.members')} rows={defaultMemberRows} />

        {rawInput.extraProviders.map((provider) => (
          <SummarySection
            key={provider.name}
            title={`${t('IdentityProviders.customIdp')}: ${provider.name}`}
            rows={provider.roleBindings.flatMap((rb) =>
              rb.subjects.map((subject) => ({
                label: subject.name,
                value: `${subject.kind} · ${rb.roleRefs[0]?.name ?? ''}`,
              })),
            )}
          />
        ))}

        {serviceRows.length > 0 && <SummarySection title={t('ServiceSelectionStep.stepTitle')} rows={serviceRows} />}

        {providerRows.length > 0 && (
          <SummarySection title={t('ComponentInstallDialog.providers')} rows={providerRows} />
        )}
      </div>

      <WizardYamlPreview yamlString={yamlString} filename={`mcp_${rawInput.namespace}_${rawInput.name}`} />
    </div>
  );
};

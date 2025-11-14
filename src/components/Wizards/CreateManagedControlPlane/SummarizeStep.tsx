import { useTranslation } from 'react-i18next';
import { Grid, List, ListItemStandard, Title } from '@ui5/webcomponents-react';
import { stringify } from 'yaml';
import { getSelectedComponents } from '../../ComponentsSelection/ComponentsSelectionContainer.tsx';
import {
  ComponentsListItem,
  CreateManagedControlPlane,
} from '../../../lib/api/types/crate/createManagedControlPlane.ts';

import { idpPrefix } from '../../../utils/idpPrefix.ts';
import { UseFormWatch } from 'react-hook-form';
import { CreateDialogProps } from '../../Dialogs/CreateWorkspaceDialogContainer.tsx';

import styles from './SummarizeStep.module.css';
import { YamlDiff } from './YamlDiff.tsx';
import YamlSummarize from './YamlSummarize.tsx';
interface SummarizeStepProps {
  watch: UseFormWatch<CreateDialogProps>;
  projectName: string;
  workspaceName: string;
  componentsList?: ComponentsListItem[];
  originalYamlString?: string;
  isEditMode?: boolean;
}

export const SummarizeStep: React.FC<SummarizeStepProps> = ({
  originalYamlString,
  watch,
  projectName,
  workspaceName,
  componentsList,
  isEditMode = false,
}) => {
  const { t } = useTranslation();
  const resource = CreateManagedControlPlane(
    watch('name'),
    `${projectName}--ws-${workspaceName}`,
    {
      displayName: watch('displayName'),
      chargingTarget: watch('chargingTarget'),
      members: watch('members'),
      componentsList: componentsList ?? [],
      chargingTargetType: watch('chargingTargetType'),
    },
    idpPrefix,
  );
  const yamlString = stringify(resource);
  const apiGroupName = resource?.apiVersion?.split('/')[0] ?? 'core.openmcp.cloud';
  const apiVersion = resource?.apiVersion?.split('/')[1] ?? 'v1alpha1';
  return (
    <div className={styles.wrapper}>
      <Title>{t('common.summarize')}</Title>
      <Grid defaultSpan="XL6 L6 M6 S6">
        <div>
          <List headerText={t('common.metadata')}>
            <ListItemStandard text={t('common.name')} additionalText={watch('name')} />
            <ListItemStandard text={t('common.displayName')} additionalText={watch('displayName')} />
            <ListItemStandard
              text={t('CreateProjectWorkspaceDialog.chargingTargetLabel')}
              additionalText={watch('chargingTarget')}
            />
            <ListItemStandard text={t('common.namespace')} additionalText={`${projectName}--ws-${workspaceName}`} />
          </List>
          <br />
          <List headerText={t('common.members')}>
            {watch('members').map((member) => (
              <ListItemStandard key={member.name} text={member.name} additionalText={member.roles?.[0]} />
            ))}
          </List>
          <br />
          <List headerText={t('common.components')}>
            {getSelectedComponents(componentsList ?? []).map((component) => (
              <ListItemStandard key={component.name} text={component.name} additionalText={component.selectedVersion} />
            ))}
          </List>
        </div>
        <div>
          {isEditMode ? (
            <YamlDiff
              originalYaml={originalYamlString ?? ''}
              absolutePosition={true}
              modifiedYaml={stringify(
                CreateManagedControlPlane(
                  watch('name'),
                  `${projectName}--ws-${workspaceName}`,
                  {
                    displayName: watch('displayName'),
                    chargingTarget: watch('chargingTarget'),
                    members: watch('members'),
                    componentsList: componentsList ?? [],
                    chargingTargetType: watch('chargingTargetType'),
                  },
                  idpPrefix,
                ),
              )}
            />
          ) : (
            <YamlSummarize
              yamlString={yamlString}
              filename={`mcp_${projectName}--ws-${workspaceName}`}
              apiVersion={apiVersion}
              apiGroupName={apiGroupName}
            />
          )}
        </div>
      </Grid>
    </div>
  );
};

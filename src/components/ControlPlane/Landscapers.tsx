import { useTranslation } from 'react-i18next';
import {
  MultiComboBox,
  MultiComboBoxDomRef,
  MultiComboBoxItem,
  Tree,
  TreeItem,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { useState, JSX } from 'react';
import { resourcesInterval } from '../../lib/shared/constants';
import useResource, {
  useMultipleApiResources,
} from '../../lib/api/useApiResource';
import { ListNamespaces } from '../../lib/api/types/k8s/listNamespaces';
import {
  Installation,
  InstallationsRequest,
} from '../../lib/api/types/landscaper/listInstallations';
import {
  Execution,
  ExecutionsRequest,
} from '../../lib/api/types/landscaper/listExecutions';
import {
  DeployItem,
  DeployItemsRequest,
} from '../../lib/api/types/landscaper/listDeployItems';

import { MultiComboBoxSelectionChangeEventDetail } from '@ui5/webcomponents/dist/MultiComboBox.js';

export function Landscapers() {
  const { t } = useTranslation();

  const { data: namespaces } = useResource(ListNamespaces, {
    refreshInterval: resourcesInterval,
  });

  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([]);

  const { data: installations = [] } = useMultipleApiResources<Installation>(
    selectedNamespaces,
    InstallationsRequest,
  );

  const { data: executions = [] } = useMultipleApiResources<Execution>(
    selectedNamespaces,
    ExecutionsRequest,
  );

  const { data: deployItems = [] } = useMultipleApiResources<DeployItem>(
    selectedNamespaces,
    DeployItemsRequest,
  );

  const handleSelectionChange = (
    e: Ui5CustomEvent<
      MultiComboBoxDomRef,
      MultiComboBoxSelectionChangeEventDetail
    >,
  ) => {
    const selectedItems = Array.from(e.detail.items || []);
    const selectedValues = selectedItems
      .map((item) => item.text)
      .filter((text): text is string => typeof text === 'string');

    setSelectedNamespaces(selectedValues);
  };

  const getStatusSymbol = (phase?: string) => {
    if (!phase) return '⚪';

    const phaseLower = phase.toLowerCase();

    if (phaseLower === 'succeeded') {
      return '✅';
    } else if (phaseLower === 'failed') {
      return '❌';
    }

    return '⚪';
  };

  const renderTreeItems = (installation: Installation): JSX.Element => {
    const subInstallations =
      (installation.status?.subInstCache?.activeSubs
        ?.map((sub) =>
          installations.find(
            (i) =>
              i.metadata.name === sub.objectName &&
              i.metadata.namespace === installation.metadata.namespace,
          ),
        )
        .filter(Boolean) as Installation[]) || [];

    const execution = executions.find(
      (e) =>
        e.metadata.name === installation.status?.executionRef?.name &&
        e.metadata.namespace === installation.status?.executionRef?.namespace,
    );

    const relatedDeployItems =
      (execution?.status?.deployItemCache?.activeDIs
        ?.map((di) =>
          deployItems.find(
            (item) =>
              item.metadata.name === di.objectName &&
              item.metadata.namespace === execution.metadata.namespace,
          ),
        )
        .filter(Boolean) as DeployItem[]) || [];

    return (
      <TreeItem
        key={installation.metadata.uid}
        text={`${getStatusSymbol(installation.status?.phase)} ${t(
          'Landscapers.treeInstallation',
        )}: ${installation.metadata.name} (${installation.status?.phase || '-'})`}
      >
        {subInstallations.length > 0 ? (
          subInstallations.map((sub) => renderTreeItems(sub))
        ) : (
          <>
            <TreeItem
              text={`${
                execution
                  ? `${getStatusSymbol(execution.status?.phase)} ${t(
                      'Landscapers.treeExecution',
                    )}: ${execution.metadata.name} (${execution.status?.phase || '-'})`
                  : t('Landscapers.noExecutionFound')
              }`}
            />

            <TreeItem text={t('Landscapers.deployItems')}>
              {relatedDeployItems.length > 0 ? (
                relatedDeployItems.map((di) => (
                  <TreeItem
                    key={di.metadata.uid}
                    text={`${getStatusSymbol(di.status?.phase)} ${t(
                      'Landscapers.treeDeployItem',
                    )}: ${di.metadata.name} (${di.status?.phase || '-'})`}
                  />
                ))
              ) : (
                <TreeItem text={t('Landscapers.noItemsFound')} />
              )}
            </TreeItem>
          </>
        )}
      </TreeItem>
    );
  };

  const rootInstallations = installations.filter((inst) => {
    return !installations.some((parent) =>
      parent.status?.subInstCache?.activeSubs?.some(
        (sub: { objectName: string }) =>
          sub.objectName === inst.metadata.name &&
          parent.metadata.namespace === inst.metadata.namespace,
      ),
    );
  });

  return (
    <>
      {namespaces && (
        <MultiComboBox
          placeholder={t('Landscapers.multiComboBoxPlaceholder')}
          style={{ marginBottom: '1rem' }}
          onSelectionChange={handleSelectionChange}
        >
          {namespaces.map((ns) => (
            <MultiComboBoxItem key={ns.metadata.name} text={ns.metadata.name} />
          ))}
        </MultiComboBox>
      )}
      <Tree>{rootInstallations.map((inst) => renderTreeItems(inst))}</Tree>
    </>
  );
}

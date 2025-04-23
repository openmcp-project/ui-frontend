import { AnalyticalTable } from '@ui5/webcomponents-react';
import { ThemingParameters } from '@ui5/webcomponents-react-base';
import { CopyButton } from '../Shared/CopyButton.tsx';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import useResource from '../../lib/api/useApiResource';
import { projectnameToNamespace } from '../../utils';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/arrow-right';
import { ListProjectNames } from '../../lib/api/types/crate/listProjectNames';
import { t } from 'i18next';

import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';

export default function ProjectsList() {
  const navigate = useLuigiNavigate();
  const { data, error } = useResource(ListProjectNames, {
    refreshInterval: 3000,
  });
  if (error) {
    return <IllustratedError error={error} />;
  }
  return (
    <AnalyticalTable
      style={{ margin: '12px' }}
      columns={[
        {
          Header: t('ProjectsListView.title'),
          accessor: 'projectName',
          Cell: (instance: any) => (
            <div
              style={{
                cursor: 'pointer',
                width: '100%',
                color: ThemingParameters.sapLinkColor,
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.5rem',
                alignItems: 'baseline',
              }}
            >
              {instance.cell.value}
              <YamlViewButton
                resourceType={'projects'}
                resourceName={instance.cell.value}
              />
            </div>
          ),
        },
        {
          Header: 'Namespace',
          accessor: 'nameSpace',
          Cell: (instance: any) => (
            <div
              style={{
                display: 'flex',
                justifyContent: 'start',
                gap: '0.5rem',
                alignItems: 'baseline',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              <CopyButton text={instance.cell.value} />
            </div>
          ),
        },
      ]}
      data={
        data?.map((e) => {
          return {
            projectName: e,
            nameSpace: projectnameToNamespace(e),
          };
        }) ?? []
      }
      onRowClick={(e: any) => {
        navigate(
          `/mcp/projects/${data ? [e.detail.row.values.projectName] : ''}`,
        );
      }}
    />
  );
}

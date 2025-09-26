import {
  Bar,
  Breadcrumbs,
  Button,
  DynamicPage,
  DynamicPageTitle,
  FlexBox,
  ObjectPage,
  ObjectPageSection,
  ObjectPageTitle,
  Title,
  Toolbar,
  ToolbarButton,
} from '@ui5/webcomponents-react';

import { useNavigate, useParams } from 'react-router-dom';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';

import { useSplitter } from './SplitterContext.tsx';
import React, { useCallback, useEffect } from 'react';
import { ModifyGitRepositoryDialogStep1 } from '../../../components/Dialogs/ModifyGitRepositoryDialog/ModifyGitRepositoryDialogStep1.tsx';
import { stringify } from 'yaml';
import YamlViewer from '../../../components/Yaml/YamlViewer.tsx';
import { BreadcrumbsItem } from '@ui5/webcomponents-react/wrappers';
import IntelligentBreadcrumbs, { BreadCrumbFeedbackHeader } from '../../../components/Core/IntelligentBreadcrumbs.tsx';
import { ModifyKustomizationForm } from './ModifyKustomizationForm.tsx';

export function ModifyKustomizationPage() {
  const { projectName, workspaceName, controlPlaneName } = useParams();

  const splitter = useSplitter();
  const navigate = useNavigate();

  const openFakeSplitter = useCallback(() => {
    splitter.open(
      <YamlViewer
        yamlString={stringify({
          apiVersion: 'kustomize.toolkit.fluxcd.io/v1',
          kind: 'Kustomization',
          metadata: {
            name: 'flux-example-kustomization',
          },
          spec: {
            interval: '1m',
            targetNamespace: 'default',
            sourceRef: {
              kind: 'GitRepository',
              name: 'flux-example-repository',
            },
            path: './subaccount/kustomization',
            prune: true,
            timeout: '1m',
            postBuild: {
              substitute: {
                name: 'hello-docs',
                subaccount_admin_mail: 'Johannes.Ott@sap.com',
              },
            },
          },
        })}
        filename={`xxx`}
      />,
    );
  }, [splitter]);

  useEffect(() => {
    openFakeSplitter();
  }, []);

  if (!projectName || !workspaceName || !controlPlaneName) {
    return <NotFoundBanner entityType={'KUSTOMIZATION'} />;
  }

  return (
    <ObjectPage
      style={{ width: '100%' }}
      titleArea={
        <ObjectPageTitle
          header="New: Kustomization"
          breadcrumbs={<BreadCrumbFeedbackHeader />}
          actionsBar={
            !splitter.isAsideVisible ? (
              <Toolbar design="Transparent">
                <ToolbarButton
                  design="Transparent"
                  icon="sap-icon://navigation-left-arrow"
                  onClick={openFakeSplitter}
                />
              </Toolbar>
            ) : undefined
          }
        />
      }
      footerArea={
        <Bar
          design="FloatingFooter"
          endContent={
            <>
              <Button design="Emphasized" onClick={() => alert('TODO: Create…')}>
                Create
              </Button>
              <Button design="Transparent" onClick={() => navigate('../..', { relative: 'path' })}>
                Discard
              </Button>
            </>
          }
        />
      }
    >
      <ModifyKustomizationForm />
    </ObjectPage>
  );
}

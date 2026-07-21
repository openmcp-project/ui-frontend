import * as Sentry from '@sentry/react';
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom';
import GlobalProviderOutlet from './components/Core/ApiConfigWrapper.tsx';
import { ParamRedirect } from './components/Core/ParamRedirect.tsx';
import { ShellBarComponent } from './components/Core/ShellBar.tsx';
import { SearchParamToggleVisibility } from './components/Helper/FeatureToggleExistance.tsx';
import { SplitterProvider } from './components/Splitter/SplitterContext.tsx';
import { SplitterLayout } from './components/Splitter/SplitterLayout.tsx';
import HeadlampPage from './spaces/mcp/pages/HeadlampPage.tsx';
import ManagedControlPlanePage from './spaces/mcp/pages/ManagedControlPlanePage.tsx';
import ControlPlanePageV2 from './spaces/controlPlaneV2/pages/ControlPlanePageV2.tsx';
import ProjectPage from './spaces/onboarding/pages/ProjectPage.tsx';
import ProjectListView from './views/ProjectList';
import CardDesignPreview from './views/CardDesignPreview.tsx';

const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

function AppRouter() {
  return (
    <>
      <SearchParamToggleVisibility
        shouldBeVisible={(params) => {
          if (params === undefined) return true;
          if (params.get('showHeaderBar') === null) return true;
          return params?.get('showHeaderBar') === 'true';
        }}
      >
        <ShellBarComponent />
      </SearchParamToggleVisibility>

      <SplitterProvider>
        <SplitterLayout>
          <Router>
            <SentryRoutes>
              <Route path="design-preview" element={<CardDesignPreview />} />
              <Route element={<GlobalProviderOutlet />}>
                <Route path="projects" element={<ProjectListView />} />
                <Route path="projects/:projectName" element={<ProjectPage />} />
                <Route
                  path="projects/:projectName/workspaces/:workspaceName/controlplane/:controlPlaneName"
                  element={<ControlPlanePageV2 />}
                />
                <Route
                  path="projects/:projectName/workspaces/:workspaceName/controlplane/:controlPlaneName/headlamp"
                  element={<HeadlampPage />}
                />
                <Route
                  path="projects/:projectName/workspaces/:workspaceName/managedcontrolplane/:controlPlaneName"
                  element={<ManagedControlPlanePage />}
                />
              </Route>

              {/* backward-compat: /mcp prefix + old segment names */}
              <Route path="/mcp" element={<Navigate to="/projects" replace />} />
              <Route path="/mcp/projects" element={<Navigate to="/projects" replace />} />
              <Route
                path="/mcp/projects/:projectName"
                element={<ParamRedirect to={({ projectName }) => `/projects/${projectName}`} />}
              />
              <Route
                path="/mcp/projects/:projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName"
                element={
                  <ParamRedirect
                    to={({ projectName, workspaceName, controlPlaneName }) =>
                      `/projects/${projectName}/workspaces/${workspaceName}/controlplane/${controlPlaneName}`
                    }
                  />
                }
              />
              <Route
                path="/mcp/projects/:projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName/headlamp"
                element={
                  <ParamRedirect
                    to={({ projectName, workspaceName, controlPlaneName }) =>
                      `/projects/${projectName}/workspaces/${workspaceName}/controlplane/${controlPlaneName}/headlamp`
                    }
                  />
                }
              />
              <Route
                path="/mcp/projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName"
                element={
                  <ParamRedirect
                    to={({ projectName, workspaceName, controlPlaneName }) =>
                      `/projects/${projectName}/workspaces/${workspaceName}/managedcontrolplane/${controlPlaneName}`
                    }
                  />
                }
              />

              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </SentryRoutes>
          </Router>
        </SplitterLayout>
      </SplitterProvider>
    </>
  );
}

export default AppRouter;

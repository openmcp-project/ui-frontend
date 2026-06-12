import { Navigate, Route, HashRouter as Router, useParams } from 'react-router-dom';
import GlobalProviderOutlet from './components/Core/ApiConfigWrapper.tsx';
import { ShellBarComponent } from './components/Core/ShellBar.tsx';
import { SearchParamToggleVisibility } from './components/Helper/FeatureToggleExistance.tsx';
import { SplitterProvider } from './components/Splitter/SplitterContext.tsx';
import { SplitterLayout } from './components/Splitter/SplitterLayout.tsx';
import { SentryRoutes } from './mount.ts';
import HeadlampPage from './spaces/mcp/pages/HeadlampPage.tsx';
import McpPage from './spaces/mcp/pages/McpPage.tsx';
import McpPageV2 from './spaces/mcp/pages/McpPageV2.tsx';
import ProjectPage from './spaces/onboarding/pages/ProjectPage.tsx';
import ProjectListView from './views/ProjectList';

// Redirect helpers — read params and build the new canonical URL

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
              {/* Canonical routes — no /mcp prefix */}
              <Route element={<GlobalProviderOutlet />} path="/projects">
                <Route element={<ProjectListView />} path="" />
                <Route element={<ProjectPage />} path=":projectName" />
                <Route element={<McpPageV2 />} path=":projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName" />
                <Route
                  element={<HeadlampPage />}
                  path=":projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName/headlamp"
                />
                <Route element={<McpPage />} path=":projectName/workspaces/:workspaceName/mcps/:controlPlaneName" />
              </Route>

              {/* Legacy /mcp/* redirects — preserve backward compatibility */}
              <Route path="/mcp/projects" element={<Navigate replace to="/projects" />} />
              <Route
                path="/mcp/projects/:projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName/headlamp"
                element={<RedirectMcpV2Headlamp />}
              />
              <Route
                path="/mcp/projects/:projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName"
                element={<RedirectMcpV2 />}
              />
              <Route
                path="/mcp/projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName"
                element={<RedirectMcp />}
              />
              <Route path="/mcp/projects/:projectName" element={<RedirectProject />} />

              <Route path="/" element={<Navigate replace to="/projects" />} />
              <Route path="*" element={<Navigate replace to="/" />} />
            </SentryRoutes>
          </Router>
        </SplitterLayout>
      </SplitterProvider>
    </>
  );
}

export default AppRouter;

function RedirectProject() {
  const { projectName } = useParams();
  return <Navigate replace to={`/projects/${projectName}`} />;
}

function RedirectMcp() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  return <Navigate replace to={`/projects/${projectName}/workspaces/${workspaceName}/mcps/${controlPlaneName}`} />;
}

function RedirectMcpV2() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  return <Navigate replace to={`/projects/${projectName}/workspaces/${workspaceName}/mcpsv2/${controlPlaneName}`} />;
}

function RedirectMcpV2Headlamp() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  return (
    <Navigate replace to={`/projects/${projectName}/workspaces/${workspaceName}/mcpsv2/${controlPlaneName}/headlamp`} />
  );
}

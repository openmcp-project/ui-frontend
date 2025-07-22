import { HashRouter as Router, Navigate, Route } from 'react-router-dom';
import ProjectListView from './views/ProjectList';
import GlobalProviderOutlet from './components/Core/ApiConfigWrapper.tsx';
import { ShellBarComponent } from './components/Core/ShellBar.tsx';
import { SentryRoutes } from './mount.ts';
import ProjectPage from './spaces/onboarding/pages/ProjectPage.tsx';
import McpPage from './spaces/mcp/pages/McpPage.tsx';

function AppRouter() {
  return (
    <>
      <ShellBarComponent />
      <Router>
        <SentryRoutes>
          <Route path="/mcp" element={<GlobalProviderOutlet />}>
            <Route path="projects" element={<ProjectListView />} />
            <Route path="projects/:projectName" element={<ProjectPage />} />
            <Route
              path="projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName/context/:contextName"
              element={<McpPage />}
            />
          </Route>
          <Route path="/" element={<Navigate to="/mcp/projects" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </SentryRoutes>
      </Router>
    </>
  );
}

export default AppRouter;

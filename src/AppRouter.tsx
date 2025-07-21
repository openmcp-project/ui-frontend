import { HashRouter as Router, Navigate, Route } from 'react-router-dom';
import ControlPlaneView from './views/ControlPlanes/ControlPlaneView.tsx';
import ProjectListView from './views/ProjectList';
import ControlPlaneListView from './views/ControlPlanes/ControlPlaneListView.tsx';
import GlobalProviderOutlet from './components/Core/ApiConfigWrapper.tsx';
import { ShellBarComponent } from './components/Core/ShellBar.tsx';
import { SentryRoutes } from './mount.ts';

function AppRouter() {
  return (
    <>
      <ShellBarComponent />
      <Router>
        <SentryRoutes>
          <Route path="/mcp" element={<GlobalProviderOutlet />}>
            <Route path="projects" element={<ProjectListView />} />
            <Route path="projects/:projectName" element={<ControlPlaneListView />} />
            <Route
              path="projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName/context/:contextName"
              element={<ControlPlaneView />}
            />
          </Route>
          <Route path="/" element={<Navigate to="/mcp/projects" />} />
        </SentryRoutes>
      </Router>
    </>
  );
}

export default AppRouter;

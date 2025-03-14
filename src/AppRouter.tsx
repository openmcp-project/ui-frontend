import { HashRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import ControlPlaneView from "./views/ControlPlanes/ControlPlaneView.tsx";
import ProjectListView from "./views/ProjectList";
import ControlPlaneListView from "./views/ControlPlanes/ControlPlaneListView.tsx";
import GlobalProviderOutlet from "./components/Core/ApiConfigWrapper.tsx";
import { ShellBarComponent } from "./components/Core/ShellBar.tsx";

function AppRouter() {
  return (
    <>
      <ShellBarComponent />
      <Router>
        <Routes>
          <Route path="/mcp" element={<GlobalProviderOutlet />}>
            <Route path="projects" element={<ProjectListView />} />
            <Route path="projects/:projectName" element={<ControlPlaneListView />} />
            <Route
              path="projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName/context/:contextName"
              element={<ControlPlaneView />}
            />
          </Route>
          <Route
            path="/"
            element={<Navigate to="/mcp/projects" />}
          />
        </Routes>

      </Router>
    </>
  );
}

export default AppRouter;

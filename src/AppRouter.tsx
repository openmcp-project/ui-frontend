import { Navigate, Route, HashRouter as Router } from 'react-router-dom';
import GlobalProviderOutlet from './components/Core/ApiConfigWrapper.tsx';
import { ShellBarComponent } from './components/Core/ShellBar.tsx';
import { SearchParamToggleVisibility } from './components/Helper/FeatureToggleExistance.tsx';
import { SplitterProvider } from './components/Splitter/SplitterContext.tsx';
import { SplitterLayout } from './components/Splitter/SplitterLayout.tsx';
import { SentryRoutes } from './mount.ts';
import McpPage from './spaces/mcp/pages/McpPage.tsx';
import McpPageV2 from './spaces/mcp/pages/McpPageV2.tsx';
import ProjectPage from './spaces/onboarding/pages/ProjectPage.tsx';
import ProjectListView from './views/ProjectList';

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
              <Route path="/mcp" element={<GlobalProviderOutlet />}>
                <Route path="projects" element={<ProjectListView />} />
                <Route path="projects/:projectName" element={<ProjectPage />} />
                <Route
                  path="projects/:projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName"
                  element={<McpPageV2 />}
                />
                <Route
                  path="projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName"
                  element={<McpPage />}
                />
              </Route>
              <Route path="/" element={<Navigate to="/mcp/projects" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </SentryRoutes>
          </Router>
        </SplitterLayout>
      </SplitterProvider>
    </>
  );
}

export default AppRouter;

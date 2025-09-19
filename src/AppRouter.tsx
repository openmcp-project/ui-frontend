import { HashRouter as Router, Navigate, Route } from 'react-router-dom';
import ProjectListView from './views/ProjectList';
import GlobalProviderOutlet from './components/Core/ApiConfigWrapper.tsx';
import { ShellBarComponent } from './components/Core/ShellBar.tsx';
import { SentryRoutes } from './mount.ts';
import ProjectPage from './spaces/onboarding/pages/ProjectPage.tsx';
import McpPage from './spaces/mcp/pages/McpPage.tsx';
import { SearchParamToggleVisibility } from './components/Helper/FeatureToggleExistance.tsx';
import { ModifyKustomizationPage } from './spaces/mcp/pages/ModifyKustomizationPage.tsx';
import { MySplitterLayout, SplitterProvider } from './spaces/mcp/pages/SplitterContext.tsx';

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
        <MySplitterLayout>
          <Router>
            <SentryRoutes>
              <Route path="/mcp" element={<GlobalProviderOutlet />}>
                <Route path="projects" element={<ProjectListView />} />
                <Route path="projects/:projectName" element={<ProjectPage />} />
                <Route
                  path="projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName"
                  element={<McpPage />}
                />
                <Route
                  path="projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName/kustomizations/:kustomizationName"
                  element={<ModifyKustomizationPage />}
                />
              </Route>
              <Route path="/" element={<Navigate to="/mcp/projects" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </SentryRoutes>
          </Router>
        </MySplitterLayout>
      </SplitterProvider>
    </>
  );
}

export default AppRouter;

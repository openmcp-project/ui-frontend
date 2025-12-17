import { HashRouter as Router, Navigate, Route } from 'react-router-dom';
import ProjectListView from './views/ProjectList';
import GlobalProviderOutlet from './components/Core/ApiConfigWrapper.tsx';
import { ShellBarComponent } from './components/Core/ShellBar.tsx';
import { SentryRoutes } from './mount.ts';
import ProjectPage from './spaces/onboarding/pages/ProjectPage.tsx';
import McpPage from './spaces/mcp/pages/McpPage.tsx';
import { SearchParamToggleVisibility } from './components/Helper/FeatureToggleExistance.tsx';
import { SplitterProvider } from './components/Splitter/SplitterContext.tsx';
import { SplitterLayout } from './components/Splitter/SplitterLayout.tsx';

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
                <Route path="projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName">
                  <Route index element={<McpPage />} />
                  <Route path="idp/:idpName" element={<McpPage />} />
                </Route>
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

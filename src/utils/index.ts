export function inDevMode() {
  return import.meta.env.DEV;
}

// example: "project-test--ws-dev" => "dev"
export const extractWorkspaceNameFromNamespace = (namespace: string) => {
  return namespace.split('--ws-').pop();
};

export const projectnameToNamespace = (projectname: string) => {
  return `project-${projectname}`;
};

export const isInTestingMode:Boolean = !!window.Cypress;
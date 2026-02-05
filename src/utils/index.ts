export function inDevMode() {
  return import.meta.env.DEV;
}

export const projectnameToNamespace = (projectname: string) => {
  return `project-${projectname}`;
};

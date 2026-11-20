import { ensureMonacoSetup } from '../components/Yaml/monaco/setup';

// Re-export everything from the canonical location for backward compatibility.
export { ensureMonacoSetup, updateYamlSchemas } from '../components/Yaml/monaco/setup';
export type { SchemasSettings } from '../components/Yaml/monaco/setup';
export { GITHUB_LIGHT_DEFAULT, GITHUB_DARK_DEFAULT } from '../components/Yaml/monaco/theme';

export const configureMonaco = () => {
  ensureMonacoSetup();
};

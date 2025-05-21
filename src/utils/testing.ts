import { Landscape } from '../context/FrontendConfigContext.tsx';

export const isInTestingMode: boolean = !!window.Cypress;
const documentationBaseUrl = 'http://localhost:3000';
const githubBaseUrl = 'https://github.com/example/repo';

export const mockedFrontendConfig = {
  landscape: Landscape.Local,
  documentationBaseUrl: documentationBaseUrl,
  githubBaseUrl: githubBaseUrl,
};

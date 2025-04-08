import { LinkCreator } from '../lib/shared/links.ts';
import { Landscape } from '../context/FrontendConfigContext.tsx';

export const isInTestingMode: boolean = !!window.Cypress;
const documentationBaseUrl = 'http://localhost:3000';
export const mockedFrontendConfig = {
  backendUrl: 'http://localhost:3000',
  landscape: Landscape.Local,
  documentationBaseUrl: 'http://localhost:3000',
  links: new LinkCreator(documentationBaseUrl),
};

// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
import '@ui5/webcomponents-react/dist/Assets.js';
import { ThemeProvider } from '@ui5/webcomponents-react';

// Alternatively you can use CommonJS syntax:
// require('./commands')
import { mount } from 'cypress/react';
// Import commands.js using ES2015 syntax:
import './commands';
import { FrontendConfigContext } from '../../src/context/FrontendConfigContext';
import { mockedFrontendConfig } from '../../src/utils/testing';
import { ToastProvider } from '../../src/context/ToastContext.tsx';
// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', (component, options) => {
  return mount(
    <ThemeProvider>
      <ToastProvider>
        <FrontendConfigContext value={mockedFrontendConfig}>
          {component}
        </FrontendConfigContext>
      </ToastProvider>
    </ThemeProvider>,
    options,
  );
});

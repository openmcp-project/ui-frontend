import { controlPlaneV2Handlers } from './controlPlaneV2';
import { managedControlPlaneHandlers } from './managedControlPlane';
import { onboardingHandlers } from './onboarding';

// GraphQL handlers only. Auth and the rest of the REST API stay real — anything
// without a handler here bypasses to the live backend (see `browser.ts`).
export const handlers = [
  ...onboardingHandlers,
  ...controlPlaneV2Handlers,
  ...managedControlPlaneHandlers,
];


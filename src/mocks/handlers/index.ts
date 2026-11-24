import { authHandlers } from './auth';
import { controlPlaneV2Handlers } from './controlPlaneV2';
import { managedControlPlaneHandlers } from './managedControlPlane';
import { mcpHandlers } from './mcp';
import { onboardingHandlers } from './onboarding';

// Auth handlers are listed first so they win over any accidental bypass.
export const handlers = [
  ...authHandlers,
  ...onboardingHandlers,
  ...controlPlaneV2Handlers,
  ...managedControlPlaneHandlers,
  ...mcpHandlers,
];

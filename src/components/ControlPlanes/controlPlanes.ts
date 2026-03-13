import { ControlPlaneListItem } from '../../spaces/onboarding/types/ControlPlane';

export const canConnectToMCP = (controlPlane: ControlPlaneListItem): boolean => {
  const conditions = controlPlane.status?.conditions ?? [];

  return ['APIServerHealthy', 'AuthenticationHealthy', 'AuthorizationHealthy'].every((type) =>
    conditions.some((condition) => condition.type === type && String(condition.status).toLowerCase() === 'true'),
  );
};

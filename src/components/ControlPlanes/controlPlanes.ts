import { ControlPlaneType } from '../../lib/api/types/crate/controlPlanes';

export const canConnectToMCP = (controlPlane: ControlPlaneType): boolean => {
  const conditions = controlPlane.status?.conditions ?? [];

  return ['APIServerHealthy', 'AuthenticationHealthy', 'AuthorizationHealthy'].every((type) =>
    conditions.some((condition) => condition.type === type && String(condition.status).toLowerCase() === 'true'),
  );
};

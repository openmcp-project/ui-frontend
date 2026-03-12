import { ReadyStatus } from '../../spaces/onboarding/types/ControlPlane';

export const getClassNameForOverallStatus = (status: string | undefined): string => {
  switch (status) {
    case ReadyStatus.Ready:
      return 'ready';
    case ReadyStatus.NotReady:
      return 'not-ready';
    case ReadyStatus.InDeletion:
      return 'deleting';
    default:
      return '';
  }
};

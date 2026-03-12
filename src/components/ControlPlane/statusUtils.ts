import { ReadyStatus, ReadyStatusValue } from '../../spaces/onboarding/types/ControlPlane';

export const getClassNameForOverallStatus = (status: ReadyStatusValue | undefined): string => {
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

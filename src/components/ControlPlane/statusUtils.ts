import { ReadyStatus } from '../../lib/api/types/crate/controlPlanes';

export const getClassNameForOverallStatus = (status: ReadyStatus | undefined): string => {
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

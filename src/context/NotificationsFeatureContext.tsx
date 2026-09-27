import { ReactNode, createContext, use, useMemo } from 'react';
import useSWR from 'swr';
import { fetchApiServer } from '../lib/api/fetch';
import { generateCrateAPIConfig } from '../lib/api/types/apiConfig';

const NOTIFICATIONS_API_GROUP = '/apis/notifications.platform.open-control-plane.io/v1alpha1';

interface NotificationsFeature {
  enabled: boolean;
  isLoading: boolean;
}

export const NotificationsFeatureContext = createContext<NotificationsFeature>({ enabled: false, isLoading: true });

export function NotificationsFeatureProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => generateCrateAPIConfig(), []);

  const { data, isLoading } = useSWR(
    'notifications-service-probe',
    async () => {
      try {
        await fetchApiServer(NOTIFICATIONS_API_GROUP, config);
        return true;
      } catch {
        return false;
      }
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 60_000 },
  );

  const value = useMemo(() => ({ enabled: data ?? false, isLoading }), [data, isLoading]);

  return <NotificationsFeatureContext.Provider value={value}>{children}</NotificationsFeatureContext.Provider>;
}

export function useNotificationsFeature() {
  return use(NotificationsFeatureContext);
}

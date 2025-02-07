import { useQuery } from '@tanstack/react-query';
import { useDeviceId } from './useDeviceId';

export function useAppActivities(packageName: string) {
  const { deviceId } = useDeviceId();

  return useQuery({
    queryKey: ['app-activities', deviceId, packageName],
    queryFn: async () => {
      if (!deviceId || !packageName) return undefined;
      const response = await fetch(`/api/device/${deviceId}/apps/${packageName}/activities`);
      if (!response.ok) {
        throw new Error('Failed to fetch app activities');
      }
      const data = await response.json();
      return data.activities as string[];
    },
    enabled: Boolean(deviceId && packageName)
  });
} 
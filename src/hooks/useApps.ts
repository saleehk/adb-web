import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppInfo } from '@/utils/adb';
import { toast } from 'sonner';
import { useDeviceId } from '@/hooks/useDeviceId';

export function useApps(mode: 'basic' | 'full' = 'basic') {
  const { deviceId } = useDeviceId();
  
  return useQuery({
    queryKey: ['apps', deviceId, mode],
    queryFn: async () => {
      if (!deviceId) throw new Error('No device selected');
      
      const response = await fetch(`/api/device/${deviceId}/apps?mode=${mode}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch apps');
      }
      const data = await response.json();
      return data.apps as AppInfo[];
    },
    enabled: !!deviceId,
  });
}

export function useAppDetails(packageName: string) {
  const { deviceId } = useDeviceId();
  
  return useQuery({
    queryKey: ['app-details', deviceId, packageName],
    queryFn: async () => {
      if (!deviceId) throw new Error('No device selected');
      
      const response = await fetch(`/api/device/${deviceId}/apps/${packageName}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch app details');
      }
      const data = await response.json();
      return data.details as AppInfo;
    },
    enabled: !!deviceId && !!packageName,
  });
}

export function useInstallApp() {
  const { deviceId } = useDeviceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apkFile: File) => {
      if (!deviceId) throw new Error('No device selected');
      
      const formData = new FormData();
      formData.append('apkFile', apkFile);

      const response = await fetch(`/api/device/${deviceId}/apps`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to install app');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('App installed successfully');
      queryClient.invalidateQueries({ queryKey: ['apps', deviceId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to install app');
    },
  });
}

export function useAppAction(packageName: string) {
  const { deviceId } = useDeviceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: 'uninstall' | 'clear' | 'force-stop') => {
      if (!deviceId) throw new Error('No device selected');
      
      const response = await fetch(`/api/device/${deviceId}/apps/${packageName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} app`);
      }

      return response.json();
    },
    onSuccess: (_, action) => {
      toast.success(
        action === 'uninstall'
          ? 'App uninstalled successfully'
          : action === 'clear'
          ? 'App data cleared successfully'
          : 'App force stopped successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['apps', deviceId] });
      queryClient.invalidateQueries({
        queryKey: ['app-details', deviceId, packageName],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    },
  });
} 
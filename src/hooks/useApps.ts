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
      
      const response = await fetch(`/api/device/${deviceId}/apps?packageName=${packageName}`);
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

export function useAppAction() {
  const { deviceId } = useDeviceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      packageName,
      apkFile,
    }: {
      action: 'install' | 'uninstall' | 'clear' | 'force-stop';
      packageName?: string;
      apkFile?: File;
    }) => {
      if (!deviceId) throw new Error('No device selected');
      
      const formData = new FormData();
      formData.append('action', action);
      if (packageName) formData.append('packageName', packageName);
      if (apkFile) formData.append('apkFile', apkFile);

      const response = await fetch(`/api/device/${deviceId}/apps`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} app`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === 'install'
          ? 'App installed successfully'
          : variables.action === 'uninstall'
          ? 'App uninstalled successfully'
          : variables.action === 'clear'
          ? 'App data cleared successfully'
          : 'App force stopped successfully'
      );
      // Invalidate apps queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['apps', deviceId] });
      if (variables.packageName) {
        queryClient.invalidateQueries({
          queryKey: ['app-details', deviceId, variables.packageName],
        });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    },
  });
} 
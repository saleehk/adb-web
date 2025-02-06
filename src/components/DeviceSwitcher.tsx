'use client';

import { useEffect, useState } from 'react';
import { Device } from '@/utils/adb';
import { useRouter, useParams, usePathname } from 'next/navigation';

export default function DeviceSwitcher() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch('/api/devices');
        const data = await response.json();
        if (response.ok) {
          setDevices(data.devices);
        }
      } catch (error) {
        console.error('Failed to fetch devices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeviceChange = (deviceId: string) => {
    if (!deviceId) {
      router.push('/devices');
      return;
    }

    // Get the current route type (files, apps, system)
    const routeType = pathname.split('/').pop();
    const validRoutes = ['files', 'apps', 'system'];
    
    // If we're not in a device-specific route, go to files by default
    const newRoute = validRoutes.includes(routeType || '') ? routeType : 'files';
    
    router.push(`/device/${deviceId}/${newRoute}`);
  };

  if (loading) {
    return (
      <div className="px-4 py-2 text-gray-400 dark:text-gray-500">
        Loading devices...
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="px-4 py-2 text-gray-400 dark:text-gray-500">
        No devices connected
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <label className="block text-sm font-medium text-gray-400 mb-2">
        Selected Device
      </label>
      <select
        value={params?.deviceId as string || ''}
        onChange={(e) => handleDeviceChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      >
        <option value="">Select a device</option>
        {devices.map((device) => (
          <option key={device.id} value={device.id}>
            {device.model || device.id} {device.status === 'device' ? '🟢' : '🔴'}
          </option>
        ))}
      </select>
    </div>
  );
} 
 
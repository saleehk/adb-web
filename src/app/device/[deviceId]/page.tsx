'use client';

import { useEffect, useState } from 'react';
import { Device } from '@/utils/adb';
import { Card } from '@/components/ui/card';
import { LogcatViewer } from '@/components/LogcatViewer';
import { Battery, Signal, Smartphone, Wifi } from 'lucide-react';
import { decodeDeviceId } from '@/utils/deviceId';
import { DeepLinkOpener } from '@/components/DeepLinkOpener';

interface DeviceHomeProps {
  params: {
    deviceId: string;
  };
}

export default function DeviceHome({ params }: DeviceHomeProps) {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const decodedDeviceId = decodeDeviceId(params.deviceId);

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      try {
        const response = await fetch('/api/devices');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch device information');
        }

        const deviceInfo = data.devices.find((d: Device) => d.id === decodedDeviceId);
        if (!deviceInfo) {
          throw new Error('Device not found');
        }

        setDevice(deviceInfo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceInfo();
    const interval = setInterval(fetchDeviceInfo, 5000);
    return () => clearInterval(interval);
  }, [decodedDeviceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-2xl mr-2">⚠️</span>
          <p className="text-red-800 dark:text-red-200">Error: {error || 'Device not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Device Info Card */}
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-8 h-8 text-gray-500" />
            <div>
              <h3 className="font-semibold">Device</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {device.model || device.id}
              </p>
              <p className="text-xs text-gray-500">
                Android {device.androidVersion}
              </p>
            </div>
          </div>
        </Card>

        {/* Battery Card */}
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Battery className={`w-8 h-8 ${
              parseInt(device.batteryLevel || '0') > 20 
                ? 'text-green-500' 
                : 'text-red-500'
            }`} />
            <div>
              <h3 className="font-semibold">Battery</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {device.batteryLevel || 'Unknown'}
              </p>
            </div>
          </div>
        </Card>

        {/* Network Card */}
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Signal className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="font-semibold">Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {device.status === 'device' ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </Card>

        {/* IP Address Card */}
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Wifi className="w-8 h-8 text-indigo-500" />
            <div>
              <h3 className="font-semibold">IP Address</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {device.ipAddress || 'Not available'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Deep Link Opener */}
      <Card className="p-6">
        <DeepLinkOpener deviceId={decodedDeviceId} />
      </Card>

      {/* Device Logs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Device Logs</h2>
        <LogcatViewer deviceId={decodedDeviceId} />
      </div>
    </div>
  );
} 
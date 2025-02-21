'use client';

import { useEffect, useState } from 'react';
import { Device } from '@/utils/adb';
import { Card } from '@/components/ui/card';
import { LogcatViewer } from '@/components/LogcatViewer';
import { Battery, Signal, Smartphone, Wifi, Camera, RefreshCw } from 'lucide-react';
import { decodeDeviceId } from '@/utils/deviceId';
import { DeepLinkOpener } from '@/components/DeepLinkOpener';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface DeviceHomeProps {
  params: {
    deviceId: string;
  };
}

export default function DeviceHome({ params }: DeviceHomeProps) {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const decodedDeviceId = decodeDeviceId(params.deviceId);

  const takeScreenshot = async () => {
    try {
      setScreenshotLoading(true);
      const response = await fetch('/api/system/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId: decodedDeviceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to take screenshot');
      }

      const data = await response.json();
      setScreenshot(data.path);
    } catch (err) {
      console.error('Error taking screenshot:', err);
    } finally {
      setScreenshotLoading(false);
    }
  };

  // Take screenshot on initial load
  useEffect(() => {
    takeScreenshot();
  }, []);

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
      {/* Main Device Info and Screenshot Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Device Info */}
        <div className="space-y-4">
          {/* Device Info Card */}
          <Card className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Smartphone className="w-12 h-12 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">{device.model || device.id}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Android {device.androidVersion}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Battery className={`w-5 h-5 ${
                  parseInt(device.batteryLevel || '0') > 20 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`} />
                <span className="text-sm">{device.batteryLevel || 'Unknown'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Signal className="w-5 h-5 text-blue-500" />
                <span className="text-sm">
                  {device.status === 'device' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Wifi className="w-5 h-5 text-indigo-500" />
                <span className="text-sm">{device.ipAddress || 'Not available'}</span>
              </div>
            </div>
          </Card>

          {/* Deep Link Opener */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <DeepLinkOpener deviceId={decodedDeviceId} />
          </Card>
        </div>

        {/* Center Column - Screenshot */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Camera className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold">Device Screen</h3>
              </div>
              <Button
                onClick={takeScreenshot}
                disabled={screenshotLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${screenshotLoading ? 'animate-spin' : ''}`} />
                Refresh Screen
              </Button>
            </div>
            <div className="relative aspect-[9/16] w-full max-w-sm mx-auto overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {screenshot ? (
                <Image
                  src={`/api/files?path=${encodeURIComponent(screenshot)}`}
                  alt="Device Screenshot"
                  fill
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {screenshotLoading ? 'Taking screenshot...' : 'No screenshot available'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Device Logs Section */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <h2 className="text-xl font-semibold">Device Logs</h2>
        </div>
        <LogcatViewer deviceId={decodedDeviceId} />
      </Card>
    </div>
  );
} 
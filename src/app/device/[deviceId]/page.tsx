'use client';

import { useEffect, useState } from 'react';
import { Device } from '@/utils/adb';
import { Card } from '@/components/ui/card';
import { LogcatViewer } from '@/components/LogcatViewer';
import { Battery, Signal, Smartphone, Wifi, Camera, RefreshCw, Download } from 'lucide-react';
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(1);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const decodedDeviceId = decodeDeviceId(params.deviceId);

  const takeScreenshot = async () => {
    if (!isWindowFocused) return;
    
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

  const downloadScreenshot = async () => {
    if (!screenshot) return;
    
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(screenshot)}`);
      const blob = await response.blob();
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `screenshot_${new Date().toISOString()}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Error downloading screenshot:', err);
    }
  };

  // Handle window focus events
  useEffect(() => {
    const onFocus = () => setIsWindowFocused(true);
    const onBlur = () => setIsWindowFocused(false);

    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Auto-refresh screenshot
  useEffect(() => {
    if (!autoRefresh || !isWindowFocused) return;

    const interval = setInterval(takeScreenshot, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isWindowFocused]);

  // Take initial screenshot
  useEffect(() => {
    if (isWindowFocused) {
      takeScreenshot();
    }
  }, [isWindowFocused]);

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

          {/* Screenshot Controls Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Screenshot Controls</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="autoRefresh" className="text-sm font-medium">
                  Auto-refresh screenshot
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={!autoRefresh}
                  className="w-20 px-2 py-1 text-sm border rounded"
                />
                <span className="text-sm text-gray-500">seconds</span>
              </div>
              <div className="text-sm text-gray-500">
                Status: {isWindowFocused ? 'Active' : 'Inactive'} window
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
              <div className="flex items-center space-x-2">
                <Button
                  onClick={downloadScreenshot}
                  disabled={!screenshot}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={takeScreenshot}
                  disabled={screenshotLoading || (autoRefresh && isWindowFocused)}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${screenshotLoading ? 'animate-spin' : ''}`} />
                  Refresh Screen
                </Button>
              </div>
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
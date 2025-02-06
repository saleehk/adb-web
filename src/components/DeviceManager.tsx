'use client';

import { useEffect, useState } from 'react';
import { Device } from '@/utils/adb';
import WirelessConnectionDialog from './WirelessConnectionDialog';

export default function DeviceManager() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWirelessDialogOpen, setIsWirelessDialogOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch devices');
      }
      
      setDevices(data.devices);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEnableWireless = async (deviceId: string) => {
    try {
      setActionStatus(null);
      const response = await fetch('/api/devices/wireless', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enable',
          deviceId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setActionStatus({
          message: data.message,
          type: 'success',
        });
        fetchDevices();
      } else {
        setActionStatus({
          message: data.message,
          type: 'error',
        });
      }
    } catch (err) {
      setActionStatus({
        message: err instanceof Error ? err.message : 'Failed to enable wireless debugging',
        type: 'error',
      });
    }
  };

  const handleDisconnectWireless = async (device: Device) => {
    if (!device.ipAddress) return;
    
    try {
      setActionStatus(null);
      const [ip] = device.id.split(':');
      const response = await fetch('/api/devices/wireless', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect',
          ipAddress: ip,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setActionStatus({
          message: data.message,
          type: 'success',
        });
        fetchDevices();
      } else {
        setActionStatus({
          message: data.message,
          type: 'error',
        });
      }
    } catch (err) {
      setActionStatus({
        message: err instanceof Error ? err.message : 'Failed to disconnect device',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-2xl mr-2">⚠️</span>
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connected Devices</h2>
        <div className="flex space-x-3">
          <button 
            onClick={fetchDevices}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Refresh
          </button>
          <button 
            onClick={() => setIsWirelessDialogOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Connect Wireless
          </button>
        </div>
      </div>

      {actionStatus && (
        <div className={`p-4 rounded-lg ${
          actionStatus.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        } border`}>
          {actionStatus.message}
        </div>
      )}

      {devices.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📱</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Devices Connected</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Connect an Android device via USB or set up wireless debugging
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {device.model || 'Unknown Device'}
                    </h3>
                    {device.manufacturer && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {device.manufacturer}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        device.status === 'device'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                      }`}
                    >
                      {device.status}
                    </span>
                    {device.batteryLevel && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        🔋 {device.batteryLevel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p className="flex items-center">
                    <span className="mr-2">📱</span>
                    Serial: {device.serialNumber || device.id}
                  </p>
                  {device.androidVersion && (
                    <p className="flex items-center">
                      <span className="mr-2">🤖</span>
                      Android {device.androidVersion}
                    </p>
                  )}
                  {device.product && (
                    <p className="flex items-center">
                      <span className="mr-2">📦</span>
                      {device.product}
                    </p>
                  )}
                  {device.ipAddress && (
                    <p className="flex items-center">
                      <span className="mr-2">🌐</span>
                      IP: {device.ipAddress}
                    </p>
                  )}
                </div>
                <div className="mt-6 flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    Details
                  </button>
                  {device.id.includes(':') ? (
                    <button
                      onClick={() => handleDisconnectWireless(device)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnableWireless(device.id)}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Enable Wireless
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <WirelessConnectionDialog
        isOpen={isWirelessDialogOpen}
        onClose={() => setIsWirelessDialogOpen(false)}
        onSuccess={() => {
          setIsWirelessDialogOpen(false);
          fetchDevices();
        }}
      />
    </div>
  );
} 
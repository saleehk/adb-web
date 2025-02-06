'use client';

import { useState, useEffect } from 'react';
import { Device } from '@/utils/adb';

interface DeviceSelectorProps {
  onDeviceSelect: (device: Device | null) => void;
  selectedDevice: Device | null;
}

export default function DeviceSelector({ onDeviceSelect, selectedDevice }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch devices');
      }
      
      setDevices(data.devices);
      
      // If selected device is no longer available, clear selection
      if (selectedDevice && !data.devices.find((d: Device) => d.id === selectedDevice.id)) {
        onDeviceSelect(null);
      }
      // If no device is selected and we have devices, select the first one
      else if (!selectedDevice && data.devices.length > 0) {
        onDeviceSelect(data.devices[0]);
      }
      
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

  if (loading) {
    return (
      <div className="h-16 flex items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
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

  if (devices.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">📱</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Devices Connected</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Connect an Android device via USB or set up wireless debugging
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <label className="text-gray-700 dark:text-gray-300">Select Device:</label>
      <select
        value={selectedDevice?.id || ''}
        onChange={(e) => {
          const device = devices.find(d => d.id === e.target.value);
          onDeviceSelect(device || null);
        }}
        className="flex-1 max-w-xs px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        {devices.map((device) => (
          <option key={device.id} value={device.id}>
            {device.model || device.id} {device.status !== 'device' ? `(${device.status})` : ''}
          </option>
        ))}
      </select>
      <button
        onClick={fetchDevices}
        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        Refresh
      </button>
    </div>
  );
} 
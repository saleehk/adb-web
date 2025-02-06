'use client';

import { useState } from 'react';
import { Device } from '@/utils/adb';
import AppManager from '@/components/AppManager';
import DeviceSelector from '@/components/DeviceSelector';

export default function AppsPage() {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">App Management</h1>
      </div>

      <DeviceSelector
        onDeviceSelect={setSelectedDevice}
        selectedDevice={selectedDevice}
      />

      {selectedDevice && (
        <AppManager deviceId={selectedDevice.id} />
      )}
    </div>
  );
} 
'use client';

import DeviceManager from '@/components/DeviceManager';
import { LogcatViewer } from '@/components/LogcatViewer';

export default function Home() {
  return (
    <main className="container mx-auto p-4 space-y-8">
      <h1 className="text-4xl font-bold mb-8">ADB Web Interface</h1>
      <DeviceManager />
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Device Logs</h2>
        <LogcatViewer deviceId="*" />
      </div>
    </main>
  );
}

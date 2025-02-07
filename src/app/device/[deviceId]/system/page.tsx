'use client';

import { SystemControls } from '@/components/SystemControls';
import { decodeDeviceId } from '@/utils/deviceId';

interface SystemPageProps {
  params: {
    deviceId: string;
  };
}

export default function SystemPage({ params }: SystemPageProps) {
  const decodedDeviceId = decodeDeviceId(params.deviceId);
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">System Controls</h1>
      <SystemControls deviceId={decodedDeviceId} />
    </div>
  );
} 
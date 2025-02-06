'use client';

import { SystemControls } from '@/components/SystemControls';

interface SystemPageProps {
  params: {
    deviceId: string;
  };
}

export default function SystemPage({ params }: SystemPageProps) {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">System Controls</h1>
      <SystemControls deviceId={params.deviceId} />
    </div>
  );
} 
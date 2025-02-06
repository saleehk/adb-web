'use client';

import AppManager from '@/components/AppManager';

interface PageProps {
  params: {
    deviceId: string;
  };
}

export default function AppsPage({ params }: PageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">App Manager</h1>
      <AppManager deviceId={params.deviceId} />
    </div>
  );
} 
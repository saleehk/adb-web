'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DeviceManager from '@/components/DeviceManager';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/devices');
  }, [router]);

  return (
    <main className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">ADB Web Interface</h1>
      <DeviceManager />
    </main>
  );
}

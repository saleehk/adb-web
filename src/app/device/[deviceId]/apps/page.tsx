'use client';

import AppList from '@/components/AppList';

export default function AppsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Apps</h1>
      <AppList />
    </div>
  );
} 
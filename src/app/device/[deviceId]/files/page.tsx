'use client';

import FileExplorer from '@/components/FileExplorer';

export default function FilesPage({ params }: { params: { deviceId: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">File Explorer</h1>
      <FileExplorer deviceId={params.deviceId} />
    </div>
  );
} 
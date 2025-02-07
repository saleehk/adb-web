'use client';

import FileExplorer from '@/components/FileExplorer';
import { decodeDeviceId } from '@/utils/deviceId';

export default function FilesPage({ params }: { params: { deviceId: string } }) {
  const decodedDeviceId = decodeDeviceId(params.deviceId);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">File Explorer</h1>
      <FileExplorer deviceId={decodedDeviceId} />
    </div>
  );
} 
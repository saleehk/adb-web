'use client';

export default function SystemPage({ params }: { params: { deviceId: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">System Information</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">
          System information for device: {params.deviceId}
        </p>
      </div>
    </div>
  );
} 
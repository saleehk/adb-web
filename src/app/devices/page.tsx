'use client';

import { useEffect, useState } from 'react';

interface Device {
    id: string;
    status: string;
}

export default function DevicesPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/devices');
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            setDevices(data.devices);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch devices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
        // Poll for devices every 5 seconds
        const interval = setInterval(fetchDevices, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container mx-auto p-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Connected Devices</h1>
                <button
                    onClick={fetchDevices}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Refresh Devices
                </button>
            </div>

            {loading && <div className="text-gray-600">Loading devices...</div>}
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {!loading && !error && devices.length === 0 && (
                <div className="text-gray-600">No devices connected</div>
            )}

            {devices.length > 0 && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Device ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {devices.map((device) => (
                                <tr key={device.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {device.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            device.status === 'device' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {device.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

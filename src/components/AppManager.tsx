'use client';

import { useState, useEffect } from 'react';
import { AppInfo } from '@/utils/adb';
import { useDropzone } from 'react-dropzone';

interface AppManagerProps {
  deviceId: string;
}

export default function AppManager({ deviceId }: AppManagerProps) {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionStatus, setActionStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.android.package-archive': ['.apk']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const formData = new FormData();
      formData.append('deviceId', deviceId);
      formData.append('action', 'install');
      formData.append('apkFile', acceptedFiles[0]);

      try {
        setActionStatus(null);
        const response = await fetch('/api/apps', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          setActionStatus({
            message: 'App installed successfully',
            type: 'success'
          });
          fetchBasicApps();
        } else {
          setActionStatus({
            message: data.error || 'Failed to install app',
            type: 'error'
          });
        }
      } catch (err) {
        setActionStatus({
          message: err instanceof Error ? err.message : 'Failed to install app',
          type: 'error'
        });
      }
    }
  });

  const fetchBasicApps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/apps?deviceId=${deviceId}&mode=basic`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch apps');
      }
      
      if (!Array.isArray(data.apps)) {
        throw new Error('Invalid response format');
      }
      
      setApps(data.apps);
      
      // Start loading details for each app
      data.apps.forEach((app: AppInfo) => {
        fetchAppDetails(app.packageName);
      });
    } catch (err) {
      console.error('Error fetching apps:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching apps');
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppDetails = async (packageName: string) => {
    if (loadingDetails.has(packageName)) return;
    
    try {
      setLoadingDetails(prev => new Set([...prev, packageName]));
      
      const response = await fetch(`/api/apps?deviceId=${deviceId}&packageName=${packageName}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch app details');
      }
      
      setApps(prevApps => 
        prevApps.map(app => 
          app.packageName === packageName
            ? { ...app, ...data.details }
            : app
        )
      );
    } catch (error) {
      console.error(`Error fetching details for ${packageName}:`, error);
    } finally {
      setLoadingDetails(prev => {
        const next = new Set(prev);
        next.delete(packageName);
        return next;
      });
    }
  };

  useEffect(() => {
    fetchBasicApps();
    // Set up periodic refresh of basic info
    const interval = setInterval(fetchBasicApps, 30000);
    return () => clearInterval(interval);
  }, [deviceId]);

  const handleAction = async (action: 'uninstall' | 'clear' | 'force-stop', app: AppInfo) => {
    try {
      setActionStatus(null);
      const formData = new FormData();
      formData.append('deviceId', deviceId);
      formData.append('action', action);
      formData.append('packageName', app.packageName);

      const response = await fetch('/api/apps', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setActionStatus({
          message: `App ${action}ed successfully`,
          type: 'success'
        });
        if (action === 'uninstall') {
          fetchBasicApps();
        }
      } else {
        setActionStatus({
          message: data.error || `Failed to ${action} app`,
          type: 'error'
        });
      }
    } catch (err) {
      setActionStatus({
        message: err instanceof Error ? err.message : `Failed to ${action} app`,
        type: 'error'
      });
    }
  };

  const filteredApps = apps.filter(app => 
    app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-2xl mr-2">⚠️</span>
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div {...getRootProps()} className="flex-none">
          <input {...getInputProps()} />
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            {isDragActive ? 'Drop APK here' : 'Install APK'}
          </button>
        </div>
      </div>

      {actionStatus && (
        <div className={`p-4 rounded-lg ${
          actionStatus.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        } border`}>
          {actionStatus.message}
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredApps.map((app) => (
          <div
            key={app.packageName}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {app.appName === app.packageName ? (
                      <span className="opacity-70">{app.packageName}</span>
                    ) : (
                      app.appName
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {app.packageName}
                  </p>
                </div>
                {loadingDetails.has(app.packageName) ? (
                  <div className="animate-pulse w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                ) : app.isSystemApp && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    System
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p className="flex items-center">
                  <span className="mr-2">📦</span>
                  Version: {loadingDetails.has(app.packageName) ? (
                    <span className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-24 h-4 inline-block ml-1" />
                  ) : (
                    `${app.versionName} (${app.versionCode})`
                  )}
                </p>
                <p className="flex items-center">
                  <span className="mr-2">💾</span>
                  Size: {loadingDetails.has(app.packageName) ? (
                    <span className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-16 h-4 inline-block ml-1" />
                  ) : (
                    app.size
                  )}
                </p>
                {app.installTime && (
                  <p className="flex items-center">
                    <span className="mr-2">📅</span>
                    Installed: {new Date(parseInt(app.installTime)).toLocaleDateString()}
                  </p>
                )}
                {app.lastUpdateTime && app.lastUpdateTime !== app.installTime && (
                  <p className="flex items-center">
                    <span className="mr-2">🔄</span>
                    Updated: {new Date(parseInt(app.lastUpdateTime)).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => handleAction('force-stop', app)}
                  disabled={loadingDetails.has(app.packageName)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Force Stop
                </button>
                <button
                  onClick={() => handleAction('clear', app)}
                  disabled={loadingDetails.has(app.packageName)}
                  className="flex-1 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Data
                </button>
                {!app.isSystemApp && (
                  <button
                    onClick={() => handleAction('uninstall', app)}
                    disabled={loadingDetails.has(app.packageName)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Uninstall
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
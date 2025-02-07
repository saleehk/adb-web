'use client';

import { useState } from 'react';
import { AppInfo } from '@/utils/adb';
import { useDropzone } from 'react-dropzone';
import { useApps, useAppAction } from '@/hooks/useApps';
import { useDeviceId } from '@/hooks/useDeviceId';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AppManager() {
  const { deviceId } = useDeviceId();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: apps, isLoading, error } = useApps();
  const { mutate: performAppAction, isPending: isActionPending } = useAppAction();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.android.package-archive': ['.apk']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      performAppAction({
        action: 'install',
        apkFile: acceptedFiles[0]
      });
    }
  });

  const handleAction = (action: 'uninstall' | 'clear' | 'force-stop', app: AppInfo) => {
    performAppAction({
      action,
      packageName: app.packageName
    });
  };

  const filteredApps = apps?.filter(app => 
    app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!deviceId) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-2xl mr-2">⚠️</span>
          <p className="text-yellow-800 dark:text-yellow-200">No device selected</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-2xl mr-2">⚠️</span>
          <p className="text-red-800 dark:text-red-200">
            Error: {error instanceof Error ? error.message : 'Failed to load apps'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div {...getRootProps()} className="flex-none">
          <input {...getInputProps()} />
          <Button disabled={isActionPending}>
            {isDragActive ? 'Drop APK here' : 'Install APK'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredApps.map((app) => (
          <Card
            key={app.packageName}
            className="p-6"
          >
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
              {app.isSystemApp && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  System
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p className="flex items-center">
                <span className="mr-2">📦</span>
                Version: {`${app.versionName} (${app.versionCode})`}
              </p>
              <p className="flex items-center">
                <span className="mr-2">💾</span>
                Size: {app.size}
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
              <Button
                variant="secondary"
                onClick={() => handleAction('force-stop', app)}
                disabled={isActionPending}
                className="flex-1"
              >
                Force Stop
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleAction('clear', app)}
                disabled={isActionPending}
                className="flex-1"
              >
                Clear Data
              </Button>
              {!app.isSystemApp && (
                <Button
                  variant="destructive"
                  onClick={() => handleAction('uninstall', app)}
                  disabled={isActionPending}
                  className="flex-1"
                >
                  Uninstall
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 
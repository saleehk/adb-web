'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useApps, useInstallApp, useAppAction, useAppDetails } from '@/hooks/useApps';
import { useDeviceId } from '@/hooks/useDeviceId';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Loader2, 
  ExternalLink, 
  Upload, 
  Trash2, 
  Power, 
  Eraser,
  MoreVertical,
  ListFilter
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppInfo } from '@/utils/adb';

interface AppActionProps {
  onAction: (action: 'uninstall' | 'clear' | 'force-stop') => void;
  isSystemApp: boolean;
}

function AppActions({ onAction, isSystemApp }: AppActionProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction('force-stop')}>
          <Power className="h-4 w-4 mr-2" />
          Force Stop
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('clear')}>
          <Eraser className="h-4 w-4 mr-2" />
          Clear Data
        </DropdownMenuItem>
        {!isSystemApp && (
          <DropdownMenuItem 
            onClick={() => onAction('uninstall')}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Uninstall
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AppCardProps {
  app: AppInfo;
}

function AppCard({ app }: AppCardProps) {
  const { mutate: performAction } = useAppAction(app.packageName);
  const { data: appDetails } = useAppDetails(app.packageName);
  const { deviceId } = useDeviceId();
  
  const handleAction = (action: 'uninstall' | 'clear' | 'force-stop') => {
    if (action === 'uninstall') {
      if (!confirm('Are you sure you want to uninstall this app?')) {
        return;
      }
    }
    performAction(action);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <Link 
            href={`apps/${app.packageName}`}
            className="group flex items-center space-x-2"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary truncate">
              {appDetails?.appName || app.appName === app.packageName ? (
                <span className="opacity-70">{app.packageName}</span>
              ) : (
                appDetails?.appName || app.appName
              )}
            </h3>
            <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {app.packageName}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {(appDetails?.isSystemApp || app.isSystemApp) && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              System
            </span>
          )}
          <Link
            href={`/device/${deviceId}/logs?app=${app.packageName}`}
            target="_blank"
            className="text-primary hover:text-primary/80"
          >
            <ListFilter className="h-4 w-4" />
          </Link>
          <AppActions 
            onAction={handleAction}
            isSystemApp={appDetails?.isSystemApp || app.isSystemApp}
          />
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <p className="flex items-center">
          <span className="mr-2">📦</span>
          Version: {appDetails ? `${appDetails.versionName} (${appDetails.versionCode})` : `${app.versionName} (${app.versionCode})`}
        </p>
        <p className="flex items-center">
          <span className="mr-2">💾</span>
          Size: {appDetails?.size || app.size}
        </p>
        {(appDetails?.installTime || app.installTime) && (
          <p className="flex items-center">
            <span className="mr-2">📅</span>
            Installed: {appDetails?.installTime || app.installTime}
          </p>
        )}
        {((appDetails?.lastUpdateTime && appDetails.lastUpdateTime !== appDetails.installTime) || 
          (app.lastUpdateTime && app.lastUpdateTime !== app.installTime)) && (
          <p className="flex items-center">
            <span className="mr-2">🔄</span>
            Updated: {appDetails?.lastUpdateTime || app.lastUpdateTime}
          </p>
        )}
      </div>
    </Card>
  );
}

export default function AppList() {
  const { deviceId } = useDeviceId();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: apps, isLoading, error } = useApps();
  const { mutate: installApp, isPending: isInstalling } = useInstallApp();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.android.package-archive': ['.apk']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      installApp(acceptedFiles[0]);
    }
  });

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
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <Button disabled={isInstalling} className="w-full md:w-auto">
            {isDragActive ? (
              'Drop APK here'
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {isInstalling ? 'Installing...' : 'Install APK'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredApps.map((app) => (
          <AppCard key={app.packageName} app={app} />
        ))}
      </div>
    </div>
  );
} 
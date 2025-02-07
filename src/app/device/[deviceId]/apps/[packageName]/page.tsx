'use client';

import { useAppDetails } from '@/hooks/useApps';
import { useDeviceId } from '@/hooks/useDeviceId';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Activity, Play } from 'lucide-react';
import Link from 'next/link';
import { useAppActivities } from '@/hooks/useAppActivities';
import { useState } from 'react';
import { toast } from 'sonner';

interface PageProps {
  params: {
    packageName: string;
  };
}

export default function AppDetailsPage({ params }: PageProps) {
  const { packageName } = params;
  const { deviceId } = useDeviceId();
  const { data: app, isLoading, error } = useAppDetails(packageName);
  const { data: activities, isLoading: loadingActivities } = useAppActivities(packageName);
  const [startingActivity, setStartingActivity] = useState<string | null>(null);

  const handleStartActivity = async (activityName: string) => {
    try {
      setStartingActivity(activityName);
      const response = await fetch(
        `/api/device/${deviceId}/apps/${packageName}/activities/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ activityName }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start activity');
      }

      toast.success('Activity started successfully');
    } catch (error) {
      toast.error('Failed to start activity');
      console.error('Error starting activity:', error);
    } finally {
      setStartingActivity(null);
    }
  };

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

  if (error || !app) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-2xl mr-2">⚠️</span>
          <p className="text-red-800 dark:text-red-200">
            Error: {error instanceof Error ? error.message : 'Failed to load app details'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="../"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold">App Details</h1>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {app.appName === app.packageName ? (
                <span className="opacity-70">{app.packageName}</span>
              ) : (
                app.appName
              )}
            </h2>
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

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">App Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p className="flex items-center">
                  <span className="mr-2">📦</span>
                  Version: {`${app.versionName} (${app.versionCode})`}
                </p>
                <p className="flex items-center">
                  <span className="mr-2">💾</span>
                  Size: {app.size}
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {app.installTime && (
                  <p className="flex items-center">
                    <span className="mr-2">📅</span>
                    Installed: {app.installTime}
                  </p>
                )}
                {app.lastUpdateTime && app.lastUpdateTime !== app.installTime && (
                  <p className="flex items-center">
                    <span className="mr-2">🔄</span>
                    Updated: {app.lastUpdateTime}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Activities</h3>
            {loadingActivities ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                        {activity}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartActivity(activity)}
                      disabled={startingActivity === activity}
                    >
                      {startingActivity === activity ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      <span className="ml-2">Start</span>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No activities found
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
} 
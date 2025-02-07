'use client';

import AppManager from '@/components/AppManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AppAdminPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="../"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold">App Manager</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="../">
            <Button variant="outline">View Apps</Button>
          </Link>
        </div>
      </div>
      <AppManager />
    </div>
  );
} 
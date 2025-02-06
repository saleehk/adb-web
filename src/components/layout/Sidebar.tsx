'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import DeviceSwitcher from '@/components/DeviceSwitcher';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const getNavigation = (deviceId: string | null): NavItem[] => [
  { name: 'Home', href: '/', icon: '🏠' },
  { name: 'Devices', href: '/devices', icon: '📱' },
  ...(deviceId ? [
    { name: 'Files', href: `/device/${deviceId}/files`, icon: '📁' },
    { name: 'Apps', href: `/device/${deviceId}/apps`, icon: '📦' },
    { name: 'System', href: `/device/${deviceId}/system`, icon: '⚙️' },
  ] : []),
  { name: 'Settings', href: '/settings', icon: '🔧' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const deviceId = params?.deviceId as string;
  const navigation = getNavigation(deviceId);

  return (
    <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-8">ADB Web Interface</h1>
        <DeviceSwitcher />
        <nav className="space-y-2 mt-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 
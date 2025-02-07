import { LogcatViewer } from '@/components/LogcatViewer';

interface LogsPageProps {
  params: {
    deviceId: string;
  };
}

export default function LogsPage({ params }: LogsPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Device Logs</h1>
      <LogcatViewer />
    </div>
  );
} 
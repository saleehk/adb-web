'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Download, Camera, Video, RotateCw, FileCode } from 'lucide-react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  minimum: 0.1,
  trickleSpeed: 200
});

interface SystemControlsProps {
  deviceId: string;
  encodedDeviceId: string;
}

export function SystemControls({ deviceId, encodedDeviceId }: SystemControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPath, setRecordingPath] = useState<string>('');
  const [logLines, setLogLines] = useState<string[]>([]);
  const [systemInfo, setSystemInfo] = useState<{
    cpuInfo: string;
    memInfo: string;
    diskInfo: string;
    processes: string;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadFile = useCallback(async (path: string) => {
    try {
      setIsDownloading(true);
      NProgress.start();

      const response = await fetch('/api/system/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      NProgress.done();
    } catch {
      toast.error('Failed to download file');
    } finally {
      setIsDownloading(false);
      NProgress.done();
    }
  }, []);

  const handleScreenshot = async () => {
    try {
      toast.loading('Taking screenshot...');
      NProgress.start();
      const response = await fetch('/api/system/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });

      if (!response.ok) {
        throw new Error('Failed to take screenshot');
      }

      const { path } = await response.json();
      toast.success('Screenshot saved');
      await downloadFile(path);
    } catch {
      toast.error('Failed to take screenshot');
    } finally {
      NProgress.done();
    }
  };

  const handleScreenRecording = async () => {
    if (!isRecording) {
      try {
        toast.loading('Starting screen recording...');
        const response = await fetch('/api/system/screenrecord/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId })
        });

        if (!response.ok) {
          throw new Error('Failed to start recording');
        }

        const { path } = await response.json();
        setRecordingPath(path);
        setIsRecording(true);
        toast.success('Recording started');
      } catch {
        toast.error('Failed to start recording');
      }
    } else {
      try {
        toast.loading('Stopping recording...');
        NProgress.start();
        const response = await fetch('/api/system/screenrecord/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, remotePath: recordingPath })
        });

        if (!response.ok) {
          throw new Error('Failed to stop recording');
        }

        const { path } = await response.json();
        setIsRecording(false);
        setRecordingPath('');
        toast.success('Recording saved');
        await downloadFile(path);
      } catch {
        toast.error('Failed to stop recording');
      } finally {
        NProgress.done();
      }
    }
  };

  const handleReboot = async (mode?: 'system' | 'recovery' | 'bootloader') => {
    try {
      toast.loading('Rebooting device...');
      const response = await fetch('/api/system/reboot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, mode })
      });

      if (!response.ok) {
        throw new Error('Failed to reboot device');
      }

      toast.success('Device is rebooting');
    } catch (error) {
      toast.error('Failed to reboot device');
    }
  };

  const handleLogcat = async () => {
    try {
      const response = await fetch(`/api/device/${encodedDeviceId}/system/logcat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, lines: 1000 })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const { logs } = await response.json();
      setLogLines(logs.split('\n'));
    } catch (error) {
      toast.error('Failed to fetch logs');
    }
  };

  const handleSystemInfo = async () => {
    try {
      const response = await fetch('/api/system/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system information');
      }

      const info = await response.json();
      setSystemInfo(info);
    } catch (error) {
      toast.error('Failed to fetch system information');
    }
  };

  const handleSaveLogcat = async () => {
    try {
      const blob = new Blob([logLines.join('\n')], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logcat_${new Date().toISOString()}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Logcat saved');
    } catch (error) {
      toast.error('Failed to save logcat');
    }
  };

  const handlePageSource = async () => {
    try {
      setIsDownloading(true);
      toast.loading('Getting page source...');
      NProgress.start();

      const response = await fetch('/api/system/pagesource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });

      if (!response.ok) {
        throw new Error('Failed to get page source');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `page_source_${new Date().toISOString()}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Page source downloaded');
    } catch {
      toast.error('Failed to get page source');
    } finally {
      setIsDownloading(false);
      NProgress.done();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Tabs defaultValue="controls" className="w-full">
        <TabsList>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="logcat">Logcat</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Screen Capture</h3>
            <div className="space-x-4">
              <Button 
                onClick={handleScreenshot} 
                disabled={isDownloading}
              >
                <Camera className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Take Screenshot'}
              </Button>
              <Button 
                onClick={handleScreenRecording}
                variant={isRecording ? "destructive" : "default"}
                disabled={isDownloading && !isRecording}
              >
                <Video className="w-4 h-4 mr-2" />
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
              <Button 
                onClick={handlePageSource} 
                variant="outline"
                disabled={isDownloading}
              >
                <FileCode className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download Page Source'}
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Device Control</h3>
            <div className="space-x-4">
              <Select onValueChange={(value: 'system' | 'recovery' | 'bootloader') => handleReboot(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Reboot Options" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">
                    <div className="flex items-center">
                      <RotateCw className="w-4 h-4 mr-2" />
                      Normal Reboot
                    </div>
                  </SelectItem>
                  <SelectItem value="recovery">
                    <div className="flex items-center">
                      <RotateCw className="w-4 h-4 mr-2" />
                      Recovery Mode
                    </div>
                  </SelectItem>
                  <SelectItem value="bootloader">
                    <div className="flex items-center">
                      <RotateCw className="w-4 h-4 mr-2" />
                      Bootloader
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="logcat">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Logcat</h3>
              <div className="space-x-2">
                <Button onClick={handleLogcat}>Refresh Logs</Button>
                <Button onClick={handleSaveLogcat} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Save Logs
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
              <pre className="font-mono text-sm">
                {logLines.join('\n')}
              </pre>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">System Information</h3>
              <Button onClick={handleSystemInfo}>Refresh Info</Button>
            </div>
            {systemInfo && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">CPU Information</h4>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <pre className="font-mono text-sm">{systemInfo.cpuInfo}</pre>
                  </ScrollArea>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Memory Information</h4>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <pre className="font-mono text-sm">{systemInfo.memInfo}</pre>
                  </ScrollArea>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Disk Information</h4>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <pre className="font-mono text-sm">{systemInfo.diskInfo}</pre>
                  </ScrollArea>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Running Processes</h4>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <pre className="font-mono text-sm">{systemInfo.processes}</pre>
                  </ScrollArea>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
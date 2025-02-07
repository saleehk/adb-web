import { useEffect, useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Download, Pause, Play, X } from 'lucide-react';

interface LogcatViewerProps {
  deviceId: string;
}

export function LogcatViewer({ deviceId }: LogcatViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!deviceId) return;

    const connectEventSource = () => {
      const url = new URL('/api/system/logcat/stream', window.location.origin);
      url.searchParams.set('deviceId', deviceId);
      
      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('Logcat stream connected');
      };

      eventSource.onmessage = (event) => {
        if (isPaused) return;
        
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            console.error('Logcat error:', data.error);
            return;
          }
          if (data.closed) {
            console.log('Logcat stream closed:', data.code);
            eventSource.close();
            setIsConnected(false);
            return;
          }

          setLogs(prevLogs => {
            const newLogs = [...prevLogs, data];
            // Keep only last 1000 lines to prevent memory issues
            return newLogs.slice(-1000);
          });

          // Auto-scroll to bottom unless user has scrolled up
          if (scrollAreaRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
            const isScrolledToBottom = scrollHeight - scrollTop === clientHeight;
            if (isScrolledToBottom) {
              scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
            }
          }
        } catch (error) {
          console.error('Error parsing logcat data:', error);
        }
      };

      eventSource.onerror = () => {
        console.error('Logcat stream error');
        setIsConnected(false);
        eventSource.close();
        // Try to reconnect after 5 seconds
        setTimeout(connectEventSource, 5000);
      };
    };

    connectEventSource();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [deviceId, isPaused]);

  const handleClear = () => {
    setLogs([]);
  };

  const handleSave = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logcat_${deviceId}_${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const filteredLogs = filter
    ? logs.filter(log => log.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 flex-1">
          <Input
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant={isPaused ? "default" : "secondary"}
            onClick={() => setIsPaused(!isPaused)}
            className="w-24"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Download className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      <ScrollArea ref={scrollAreaRef} className="h-[500px] w-full rounded-md border p-4">
        <pre className="font-mono text-sm whitespace-pre-wrap">
          {filteredLogs.join('\n')}
        </pre>
      </ScrollArea>
    </Card>
  );
} 
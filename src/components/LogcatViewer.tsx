'use client';
import { useEffect, useState, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Download, Pause, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogcatViewerProps {
  deviceId: string;
}

const ROW_HEIGHT = 150;
const VIEWPORT_HEIGHT = 500;

// Log level colors with adjusted colors for better visibility
const LOG_COLORS: { [key: string]: string } = {
  V: 'text-neutral-400',  // Verbose - lighter gray
  D: 'text-cyan-400',     // Debug - cyan
  I: 'text-cyan-400',     // Info - cyan (matching screenshot)
  W: 'text-amber-400',    // Warning - amber
  E: 'text-rose-400',     // Error - rose
  F: 'text-red-500',      // Fatal - red
};

export function LogcatViewer({ deviceId }: LogcatViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(true);
  const [filter, setFilter] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const listRef = useRef<List | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

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
            // Remove from the start to keep only last 10000 lines
            const trimmedLogs = newLogs.length > 10000 ? newLogs.slice(-10000) : newLogs;
            
            // Schedule auto-scroll after state update
            if (autoScroll) {
              setTimeout(() => {
                listRef.current?.scrollToItem(trimmedLogs.length - 1, 'end');
              }, 0);
            }
            
            return trimmedLogs;
          });
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
  }, [deviceId, isPaused, autoScroll]);

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

  const getLogLevel = (log: string): string => {
    // Extract log level from the format "02-07 09:15:58.312  2268  2499 D"
    const match = log.match(/^\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3}\s+\d+\s+\d+\s+([VDIWEF])/);
    return match ? match[1] : 'I';
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const log = filteredLogs[index];
    
    const logLevel = getLogLevel(log);
    
    return (
      <div
        style={{
          ...style,
          padding: '1px 8px',
          lineHeight: '22px',
        }}
        className={cn(
          'font-mono text-xs tracking-tight',
          LOG_COLORS[logLevel],
          index % 2 === 0 ? 'bg-muted/5' : 'bg-transparent'
        )}
      >
        <pre className="whitespace-pre" style={{ height: '22px' }}>
          {log.substring(0, 1000)}
        </pre>
      </div>
    );
  };

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex items-center gap-2">
            <Button
              variant={isPaused ? "default" : "secondary"}
              onClick={() => setIsPaused(!isPaused)}
              className="w-28"
              size="sm"
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
            <Button variant="outline" onClick={handleClear} size="sm">
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline" onClick={handleSave} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant={autoScroll ? "default" : "secondary"}
              onClick={() => setAutoScroll(!autoScroll)}
              size="sm"
            >
              Auto-scroll: {autoScroll ? 'On' : 'Off'}
            </Button>
          </div>
        </div>
        <div className="flex items-center whitespace-nowrap">
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full mr-2',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )}
          />
          <span className="text-sm">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      <div className="rounded-md border bg-background overflow-hidden">
        <List
          ref={listRef}
          height={VIEWPORT_HEIGHT}
          itemCount={filteredLogs.length}
          itemSize={ROW_HEIGHT}
          width="100%"
          overscanCount={5}
          className="scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent"
        >
          {Row}
        </List>
      </div>
    </Card>
  );
} 
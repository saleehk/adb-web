import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { encodeDeviceId } from '@/utils/deviceId';

interface DeepLinkOpenerProps {
  deviceId: string;
}

export function DeepLinkOpener({ deviceId }: DeepLinkOpenerProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('Please enter a deep link URL');
      return;
    }

    try {
      setIsLoading(true);
      const encodedId = encodeDeviceId(deviceId);
      const response = await fetch(`/api/device/${encodedId}/deeplink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to open deep link');
      }

      toast.success('Deep link opened successfully');
      setUrl('');
    } catch (error) {
      toast.error('Failed to open deep link');
      console.error('Error opening deep link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Open Deep Link</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter deep link URL (e.g., myapp://path)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Open'
          )}
        </Button>
      </form>
    </div>
  );
} 
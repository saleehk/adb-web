import { useParams } from 'next/navigation';
import { decodeDeviceId } from '@/utils/deviceId';

export function useDeviceId() {
  const params = useParams();
  const encodedDeviceId = params?.deviceId as string;
  const deviceId = encodedDeviceId ? decodeDeviceId(encodedDeviceId) : null;

  return {
    deviceId: encodedDeviceId,
    decodedDeviceId: deviceId,
  };
} 
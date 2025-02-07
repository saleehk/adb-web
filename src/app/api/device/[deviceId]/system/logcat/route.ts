import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';
import { decodeDeviceId } from '@/utils/deviceId';

export async function POST(request: Request, { params }: { params: { deviceId: string } }) {
  const deviceIdEncoded = params.deviceId;
  const deviceId = decodeDeviceId(deviceIdEncoded);
  try {
    const { filter, lines } = await request.json();
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const adb = ADBManager.getInstance();
    const logs = await adb.getLogcat(deviceId, { filter, lines });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error getting logcat:', error);
    return NextResponse.json({ error: 'Failed to get logcat' }, { status: 500 });
  }
} 
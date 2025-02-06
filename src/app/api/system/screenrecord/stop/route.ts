import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';

export async function POST(request: Request) {
  try {
    const { deviceId, remotePath } = await request.json();
    if (!deviceId || !remotePath) {
      return NextResponse.json({ error: 'Device ID and remote path are required' }, { status: 400 });
    }

    const adb = ADBManager.getInstance();
    const localPath = await adb.stopScreenRecording(deviceId, remotePath);

    return NextResponse.json({ path: localPath });
  } catch (error) {
    console.error('Error stopping screen recording:', error);
    return NextResponse.json({ error: 'Failed to stop screen recording' }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';

export async function POST(request: Request) {
  try {
    const { deviceId } = await request.json();
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const adb = ADBManager.getInstance();
    const remotePath = await adb.startScreenRecording(deviceId);

    return NextResponse.json({ path: remotePath });
  } catch (error) {
    console.error('Error starting screen recording:', error);
    return NextResponse.json({ error: 'Failed to start screen recording' }, { status: 500 });
  }
} 
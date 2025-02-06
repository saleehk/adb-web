import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';

export async function POST(request: Request) {
  try {
    const { deviceId } = await request.json();
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const adb = ADBManager.getInstance();
    const info = await adb.getSystemInfo(deviceId);

    return NextResponse.json(info);
  } catch (error) {
    console.error('Error getting system info:', error);
    return NextResponse.json({ error: 'Failed to get system info' }, { status: 500 });
  }
} 
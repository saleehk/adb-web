import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';

export async function POST(request: Request) {
  try {
    const { deviceId, filter, lines } = await request.json();
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
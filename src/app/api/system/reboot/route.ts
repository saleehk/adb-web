import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';

export async function POST(request: Request) {
  try {
    const { deviceId, mode } = await request.json();
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const adb = ADBManager.getInstance();
    await adb.rebootDevice(deviceId, mode);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rebooting device:', error);
    return NextResponse.json({ error: 'Failed to reboot device' }, { status: 500 });
  }
} 
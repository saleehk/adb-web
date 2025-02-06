import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';

export async function POST(request: Request) {
  try {
    const { deviceId } = await request.json();
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const adb = ADBManager.getInstance();
    const localPath = await adb.takeScreenshot(deviceId);

    return NextResponse.json({ path: localPath });
  } catch (error) {
    console.error('Error taking screenshot:', error);
    return NextResponse.json({ error: 'Failed to take screenshot' }, { status: 500 });
  }
} 
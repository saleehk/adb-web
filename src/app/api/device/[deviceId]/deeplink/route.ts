import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';
import { decodeDeviceId } from '@/utils/deviceId';

export async function POST(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json(
        { error: 'Deep link URL is required' },
        { status: 400 }
      );
    }

    const adb = ADBManager.getInstance();
    const deviceId = decodeDeviceId(params.deviceId);
    await adb.openDeepLink(deviceId, url);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error opening deep link:', error);
    return NextResponse.json(
      { error: 'Failed to open deep link' },
      { status: 500 }
    );
  }
} 
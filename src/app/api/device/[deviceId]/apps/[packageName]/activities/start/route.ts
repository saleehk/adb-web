import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';
import { decodeDeviceId } from '@/utils/deviceId';

export async function POST(
  request: Request,
  { params }: { params: { deviceId: string; packageName: string } }
) {
  try {
    const { activityName } = await request.json();
    if (!activityName) {
      return NextResponse.json(
        { error: 'Activity name is required' },
        { status: 400 }
      );
    }

    const adb = ADBManager.getInstance();
    const deviceId = decodeDeviceId(params.deviceId);
    await adb.startActivity(deviceId, params.packageName, activityName);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error starting activity:', error);
    return NextResponse.json(
      { error: 'Failed to start activity' },
      { status: 500 }
    );
  }
} 
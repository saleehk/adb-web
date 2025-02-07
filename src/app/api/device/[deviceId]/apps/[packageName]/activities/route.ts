import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';
import { decodeDeviceId } from '@/utils/deviceId';

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string; packageName: string } }
) {
  try {
    const adb = ADBManager.getInstance();
    const deviceId = decodeDeviceId(params.deviceId);
    const activities = await adb.getAppActivities(deviceId, params.packageName);
    
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error getting app activities:', error);
    return NextResponse.json(
      { error: 'Failed to get app activities' },
      { status: 500 }
    );
  }
} 
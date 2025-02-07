import { NextRequest, NextResponse } from 'next/server';
import { ADBManager } from '@/utils/adb';
import { decodeDeviceId } from '@/utils/deviceId';
import { CacheManager } from '@/utils/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string; packageName: string } }
) {
  const deviceIdEncoded = params.deviceId;
  const deviceId = decodeDeviceId(deviceIdEncoded);
  const { packageName } = params;

  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
  }

  try {
    const cacheManager = CacheManager.getInstance();
    const cacheKey = `app_details_${deviceId}_${packageName}`;
    
    // Try to get from cache first
    const cachedDetails = await cacheManager.get(cacheKey);
    if (cachedDetails) {
      return NextResponse.json({ details: cachedDetails });
    }

    // If not in cache, fetch from device
    const adb = ADBManager.getInstance();
    const details = await adb.getAppInfo(deviceId, packageName);
    
    // Store in cache
    await cacheManager.set(cacheKey, details);
    
    return NextResponse.json({ details });
  } catch (error) {
    console.error('Error fetching app details:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch app details' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { deviceId: string; packageName: string } }
) {
  const deviceIdEncoded = params.deviceId;
  const deviceId = decodeDeviceId(deviceIdEncoded);
  const { packageName } = params;
  const { action } = await request.json();

  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
  }

  if (!action) {
    return NextResponse.json({ error: 'Action is required' }, { status: 400 });
  }

  const adb = ADBManager.getInstance();

  try {
    switch (action) {
      case 'uninstall':
        await adb.uninstallApp(deviceId, packageName);
        return NextResponse.json({ success: true });

      case 'clear':
        await adb.clearAppData(deviceId, packageName);
        return NextResponse.json({ success: true });

      case 'force-stop':
        await adb.forceStopApp(deviceId, packageName);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error handling app operation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    );
  }
} 
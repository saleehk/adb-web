import { NextRequest, NextResponse } from 'next/server';
import { ADBManager } from '@/utils/adb';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { decodeDeviceId } from '@/utils/deviceId';

export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  const deviceIdEncoded = params.deviceId;
  const deviceId = decodeDeviceId(deviceIdEncoded);
  const searchParams = request.nextUrl.searchParams;
  const packageName = searchParams.get('packageName');
  const mode = searchParams.get('mode');

  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
  }

  try {
    const adb = ADBManager.getInstance();

    if (packageName) {
      const details = await adb.getAppInfo(deviceId, packageName);
      return NextResponse.json({ details });
    }

    const apps = mode === 'basic' 
      ? await adb.getBasicAppList(deviceId)
      : await adb.getInstalledApps(deviceId);
    
    return NextResponse.json({ apps });
  } catch (error) {
    console.error('Error fetching apps:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  const deviceIdEncoded = params.deviceId;
  const deviceId = decodeDeviceId(deviceIdEncoded);
  const formData = await request.formData();
  const action = formData.get('action') as string;

  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
  }

  const adb = ADBManager.getInstance();

  try {
    switch (action) {
      case 'install': {
        const apkFile = formData.get('apkFile') as File;
        if (!apkFile) {
          return NextResponse.json({ error: 'APK file is required' }, { status: 400 });
        }

        const buffer = Buffer.from(await apkFile.arrayBuffer());
        const tempPath = join(tmpdir(), apkFile.name);
        await writeFile(tempPath, buffer);
        await adb.installApp(deviceId, tempPath);
        await unlink(tempPath);
        return NextResponse.json({ success: true });
      }

      case 'uninstall': {
        const packageName = formData.get('packageName') as string;
        if (!packageName) {
          return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
        }
        await adb.uninstallApp(deviceId, packageName);
        return NextResponse.json({ success: true });
      }

      case 'clear': {
        const packageName = formData.get('packageName') as string;
        if (!packageName) {
          return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
        }
        await adb.clearAppData(deviceId, packageName);
        return NextResponse.json({ success: true });
      }

      case 'force-stop': {
        const packageName = formData.get('packageName') as string;
        if (!packageName) {
          return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
        }
        await adb.forceStopApp(deviceId, packageName);
        return NextResponse.json({ success: true });
      }

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
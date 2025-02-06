import { NextRequest, NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');
    const packageName = searchParams.get('packageName');
    const mode = searchParams.get('mode') || 'basic';

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const adbManager = ADBManager.getInstance();

    if (packageName) {
      // Get specific app details
      const details = await adbManager.getAppDetails(deviceId, packageName);
      return NextResponse.json({ details });
    } else if (mode === 'basic') {
      // Get basic app list
      const apps = await adbManager.getBasicAppList(deviceId);
      return NextResponse.json({ apps });
    } else {
      // Get full app list with details
      const apps = await adbManager.getInstalledApps(deviceId);
      return NextResponse.json({ apps });
    }
  } catch (error) {
    console.error('Error handling app request:', error);
    return NextResponse.json(
      { error: 'Failed to process app request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const deviceId = formData.get('deviceId') as string;
    const action = formData.get('action') as string;
    const packageName = formData.get('packageName') as string;
    const apkFile = formData.get('apkFile') as File;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const adbManager = ADBManager.getInstance();

    switch (action) {
      case 'install': {
        if (!apkFile) {
          return NextResponse.json(
            { error: 'APK file is required' },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await apkFile.arrayBuffer());
        const tempPath = join(tmpdir(), apkFile.name);
        await writeFile(tempPath, buffer);
        
        await adbManager.installApp(deviceId, tempPath);
        return NextResponse.json({ success: true });
      }

      case 'uninstall': {
        if (!packageName) {
          return NextResponse.json(
            { error: 'Package name is required' },
            { status: 400 }
          );
        }
        
        await adbManager.uninstallApp(deviceId, packageName);
        return NextResponse.json({ success: true });
      }

      case 'clear': {
        if (!packageName) {
          return NextResponse.json(
            { error: 'Package name is required' },
            { status: 400 }
          );
        }
        
        await adbManager.clearAppData(deviceId, packageName);
        return NextResponse.json({ success: true });
      }

      case 'force-stop': {
        if (!packageName) {
          return NextResponse.json(
            { error: 'Package name is required' },
            { status: 400 }
          );
        }
        
        await adbManager.forceStopApp(deviceId, packageName);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error handling app operation:', error);
    return NextResponse.json(
      { error: 'Failed to process app operation' },
      { status: 500 }
    );
  }
} 
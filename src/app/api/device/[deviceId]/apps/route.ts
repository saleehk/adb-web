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
  const mode = searchParams.get('mode');

  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
  }

  try {
    const adb = ADBManager.getInstance();
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
  const apkFile = formData.get('apkFile') as File;

  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
  }

  if (!apkFile) {
    return NextResponse.json({ error: 'APK file is required' }, { status: 400 });
  }

  const adb = ADBManager.getInstance();

  try {
    const buffer = Buffer.from(await apkFile.arrayBuffer());
    const tempPath = join(tmpdir(), apkFile.name);
    await writeFile(tempPath, buffer);
    await adb.installApp(deviceId, tempPath);
    await unlink(tempPath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error installing app:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to install app' },
      { status: 500 }
    );
  }
} 
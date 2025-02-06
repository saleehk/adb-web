import { NextRequest, NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');
    const path = searchParams.get('path') || '/';

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const adbManager = ADBManager.getInstance();
    const files = await adbManager.listFiles(deviceId, path);
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const deviceId = formData.get('deviceId') as string;
    const path = formData.get('path') as string;
    const action = formData.get('action') as string;
    const file = formData.get('file') as File;

    if (!deviceId || !path) {
      return NextResponse.json(
        { error: 'Device ID and path are required' },
        { status: 400 }
      );
    }

    const adbManager = ADBManager.getInstance();

    switch (action) {
      case 'upload': {
        if (!file) {
          return NextResponse.json(
            { error: 'File is required' },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const tempPath = join(tmpdir(), file.name);
        await writeFile(tempPath, buffer);
        
        await adbManager.uploadFile(deviceId, tempPath, path);
        return NextResponse.json({ success: true });
      }

      case 'createDir': {
        await adbManager.createDirectory(deviceId, path);
        return NextResponse.json({ success: true });
      }

      case 'delete': {
        await adbManager.deleteFile(deviceId, path);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error handling file operation:', error);
    return NextResponse.json(
      { error: 'Failed to process file operation' },
      { status: 500 }
    );
  }
} 
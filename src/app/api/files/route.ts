import { NextRequest, NextResponse } from 'next/server';
import { ADBManager } from '@/utils/adb';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deviceId = searchParams.get('deviceId');
  const path = searchParams.get('path') || '/';

  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
  }

  try {
    const adb = ADBManager.getInstance();
    const files = await adb.listFiles(deviceId, path);
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list files' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const deviceId = formData.get('deviceId') as string;
  const path = formData.get('path') as string;
  const action = formData.get('action') as string;

  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
  }

  if (!path) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  const adb = ADBManager.getInstance();

  try {
    switch (action) {
      case 'upload': {
        const file = formData.get('file') as File;
        if (!file) {
          return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const tempPath = join(tmpdir(), file.name);
        await writeFile(tempPath, buffer);
        await adb.uploadFile(deviceId, tempPath, path);
        await unlink(tempPath);
        return NextResponse.json({ success: true });
      }

      case 'createDir':
        await adb.createDirectory(deviceId, path);
        return NextResponse.json({ success: true });

      case 'delete':
        await adb.deleteFile(deviceId, path);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error handling file operation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    );
  }
} 
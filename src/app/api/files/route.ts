import { NextRequest, NextResponse } from 'next/server';
import { ADBManager } from '@/utils/adb';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { extname } from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deviceId = searchParams.get('deviceId');
  const path = searchParams.get('path');

  // If path is provided without deviceId, serve the file
  if (path && !deviceId) {
    return serveFile(request);
  }

  // Otherwise, list files from device
  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
  }

  try {
    const adb = ADBManager.getInstance();
    const files = await adb.listFiles(deviceId, path || '/');
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

export async function serveFile(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // For security, only allow access to files in /tmp directory
    if (!path.startsWith('/tmp/')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const fileContent = await readFile(path);
    const ext = extname(path).toLowerCase();

    // Set appropriate content type based on file extension
    const contentType = ext === '.png' ? 'image/png'
      : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
      : ext === '.mp4' ? 'video/mp4'
      : 'application/octet-stream';

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
} 
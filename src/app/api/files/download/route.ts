import { NextRequest, NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFile } from 'fs/promises';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');
    const path = searchParams.get('path');

    if (!deviceId || !path) {
      return NextResponse.json(
        { error: 'Device ID and path are required' },
        { status: 400 }
      );
    }

    const adbManager = ADBManager.getInstance();
    const fileName = path.split('/').pop() || 'download';
    const tempPath = join(tmpdir(), fileName);

    await adbManager.downloadFile(deviceId, path, tempPath);
    const fileBuffer = await readFile(tempPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
} 
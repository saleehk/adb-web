import { NextRequest, NextResponse } from 'next/server';
import { ADBManager } from '@/utils/adb';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deviceId = searchParams.get('deviceId');
  const path = searchParams.get('path');

  if (!deviceId) {
    return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
  }

  if (!path) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const adb = ADBManager.getInstance();
    const tempPath = join(tmpdir(), path.split('/').pop() || 'download');
    
    await adb.downloadFile(deviceId, path, tempPath);
    const fileContent = await readFile(tempPath);
    await unlink(tempPath);

    const fileName = path.split('/').pop() || 'download';
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('Content-Type', 'application/octet-stream');

    return new NextResponse(fileContent, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download file' },
      { status: 500 }
    );
  }
} 
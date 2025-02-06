import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { basename } from 'path';

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    if (!path) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Read the file
    const fileBuffer = readFileSync(path);
    const fileName = basename(path);

    // Create response with file data
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': path.endsWith('.png') ? 'image/png' : 'video/mp4',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
} 
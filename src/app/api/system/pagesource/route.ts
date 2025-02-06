import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';

export async function POST(request: Request) {
  try {
    const { deviceId } = await request.json();
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const adb = ADBManager.getInstance();
    const source = await adb.getPageSource(deviceId);

    return new NextResponse(source, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="page_source_${new Date().toISOString()}.xml"`,
      },
    });
  } catch (error) {
    console.error('Error getting page source:', error);
    return NextResponse.json({ error: 'Failed to get page source' }, { status: 500 });
  }
} 
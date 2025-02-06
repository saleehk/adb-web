import { NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';

export async function GET() {
    try {
        const adbManager = ADBManager.getInstance();
        const devices = await adbManager.getDevices();
        return NextResponse.json({ devices });
    } catch (error) {
        console.error('Error fetching devices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch devices' },
            { status: 500 }
        );
    }
}

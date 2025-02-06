import { NextRequest, NextResponse } from 'next/server';
import ADBManager from '@/utils/adb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, deviceId, ipAddress, port } = body;
    const adbManager = ADBManager.getInstance();

    switch (action) {
      case 'enable': {
        if (!deviceId) {
          return NextResponse.json(
            { error: 'Device ID is required' },
            { status: 400 }
          );
        }
        const result = await adbManager.enableWirelessDebugging(deviceId);
        return NextResponse.json(result);
      }

      case 'connect': {
        if (!ipAddress) {
          return NextResponse.json(
            { error: 'IP address is required' },
            { status: 400 }
          );
        }
        const result = await adbManager.connectToWirelessDevice(ipAddress, port);
        return NextResponse.json(result);
      }

      case 'disconnect': {
        if (!ipAddress) {
          return NextResponse.json(
            { error: 'IP address is required' },
            { status: 400 }
          );
        }
        const result = await adbManager.disconnectWirelessDevice(ipAddress, port);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error handling wireless connection:', error);
    return NextResponse.json(
      { error: 'Failed to process wireless connection request' },
      { status: 500 }
    );
  }
} 
import { NextRequest } from 'next/server';
import { spawn, ChildProcess } from 'child_process';
import { decodeDeviceId } from '@/utils/deviceId';
export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  const deviceIdEncoded = params.deviceId;
  const deviceId = decodeDeviceId(deviceIdEncoded);

  if (!deviceId) {
    return new Response('Device ID is required', { status: 400 });
  }

  let logcatProcess: ChildProcess | null = null;

  try {
    // Create a readable stream
    const stream = new ReadableStream({
      start(controller) {
        // Spawn logcat process
        logcatProcess = spawn('adb', ['-s', deviceId, 'logcat']);

        if (!logcatProcess.stdout || !logcatProcess.stderr) {
          throw new Error('Failed to start logcat process');
        }

        // Stream logcat output
        logcatProcess.stdout.on('data', (data) => {
          controller.enqueue(`data: ${JSON.stringify(data.toString())}\n\n`);
        });

        logcatProcess.stderr.on('data', (data) => {
          controller.enqueue(`data: ${JSON.stringify({ error: data.toString() })}\n\n`);
        });

        logcatProcess.on('close', (code) => {
          controller.enqueue(`data: ${JSON.stringify({ closed: true, code })}\n\n`);
          controller.close();
        });
      },
      cancel() {
        if (logcatProcess && !logcatProcess.killed) {
          logcatProcess.kill();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    if (logcatProcess && !logcatProcess.killed) {
      logcatProcess.kill();
    }
    console.error('Error in logcat stream:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 
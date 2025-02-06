import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
    try {
        const { stdout, stderr } = await execAsync('adb devices');
        
        if (stderr) {
            return NextResponse.json({ error: stderr }, { status: 500 });
        }

        // Parse the adb devices output
        const lines = stdout.trim().split('\n');
        // Remove the first line (List of devices attached)
        lines.shift();
        
        const devices = lines
            .filter(line => line.trim() !== '')
            .map(line => {
                const [id, status] = line.trim().split('\t');
                return { id, status };
            });

        return NextResponse.json({ devices });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to execute adb command' },
            { status: 500 }
        );
    }
}

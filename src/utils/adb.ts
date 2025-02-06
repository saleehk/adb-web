import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Device {
  id: string;
  status: string;
  model?: string;
  androidVersion?: string;
  product?: string;
}

export class ADBManager {
  private static instance: ADBManager;

  private constructor() {}

  public static getInstance(): ADBManager {
    if (!ADBManager.instance) {
      ADBManager.instance = new ADBManager();
    }
    return ADBManager.instance;
  }

  async getDevices(): Promise<Device[]> {
    try {
      const { stdout } = await execAsync('adb devices -l');
      const lines = stdout.split('\n').slice(1); // Skip the first line (List of devices attached)
      
      const devices: Device[] = [];
      
      for (const line of lines) {
        if (line.trim()) {
          const [id, ...rest] = line.trim().split(' ');
          if (id) {
            const device: Device = {
              id,
              status: rest[0] || 'unknown'
            };
            
            // Get additional device information if device is connected
            if (device.status === 'device') {
              try {
                const { stdout: model } = await execAsync(`adb -s ${id} shell getprop ro.product.model`);
                device.model = model.trim();
                
                const { stdout: version } = await execAsync(`adb -s ${id} shell getprop ro.build.version.release`);
                device.androidVersion = version.trim();
                
                const { stdout: product } = await execAsync(`adb -s ${id} shell getprop ro.product.name`);
                device.product = product.trim();
              } catch (error) {
                console.error(`Error getting device details: ${error}`);
              }
            }
            
            devices.push(device);
          }
        }
      }
      
      return devices;
    } catch (error) {
      console.error(`Error listing devices: ${error}`);
      throw new Error('Failed to list ADB devices');
    }
  }
}

export default ADBManager; 
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Device {
  id: string;
  status: string;
  model?: string;
  androidVersion?: string;
  product?: string;
  manufacturer?: string;
  serialNumber?: string;
  batteryLevel?: string;
  ipAddress?: string;
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

  private async getDeviceProperty(id: string, prop: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`adb -s ${id} shell getprop ${prop}`);
      return stdout.trim();
    } catch (error) {
      console.error(`Error getting property ${prop} for device ${id}:`, error);
      return '';
    }
  }

  private async getBatteryLevel(id: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`adb -s ${id} shell dumpsys battery | grep level`);
      const match = stdout.match(/level:\s*(\d+)/);
      return match ? `${match[1]}%` : 'Unknown';
    } catch (error) {
      console.error(`Error getting battery level for device ${id}:`, error);
      return 'Unknown';
    }
  }

  private async getDeviceIpAddress(id: string): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `adb -s ${id} shell ip addr show wlan0 | grep "inet\\s" | awk '{print $2}' | cut -d/ -f1`
      );
      return stdout.trim();
    } catch (error) {
      console.error(`Error getting IP address for device ${id}:`, error);
      return '';
    }
  }

  async enableWirelessDebugging(id: string): Promise<{ success: boolean; message: string }> {
    console.log(`🔌 Attempting to enable wireless debugging for device ${id}`);
    try {
      // Check if device is connected via USB
      if (!id.includes(':')) {
        // Get device IP address
        const ipAddress = await this.getDeviceIpAddress(id);
        if (!ipAddress) {
          console.log('❌ Failed to get device IP address');
          return { 
            success: false, 
            message: 'Failed to get device IP address. Make sure Wi-Fi is enabled.' 
          };
        }
        console.log(`📱 Device IP address: ${ipAddress}`);

        // Enable ADB over TCP/IP
        console.log('🔄 Enabling ADB over TCP/IP...');
        await execAsync(`adb -s ${id} tcpip 5555`);
        
        // Wait for the device to switch to TCP/IP mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Connect to the device wirelessly
        console.log('🤝 Connecting to device wirelessly...');
        await execAsync(`adb connect ${ipAddress}:5555`);
        
        console.log('✅ Wireless debugging enabled successfully');
        return {
          success: true,
          message: `Successfully enabled wireless debugging. Connected to ${ipAddress}:5555`
        };
      }
      
      console.log('ℹ️ Device is already in wireless mode');
      return {
        success: false,
        message: 'Device is already in wireless mode'
      };
    } catch (error) {
      console.error('❌ Error enabling wireless debugging:', error);
      return {
        success: false,
        message: 'Failed to enable wireless debugging'
      };
    }
  }

  async connectToWirelessDevice(ipAddress: string, port: string = '5555'): Promise<{ success: boolean; message: string }> {
    console.log(`🔄 Attempting to connect to device at ${ipAddress}:${port}`);
    try {
      const { stdout } = await execAsync(`adb connect ${ipAddress}:${port}`);
      const isSuccess = stdout.includes('connected');
      
      console.log(isSuccess ? '✅ Device connected successfully' : '❌ Failed to connect to device');
      return {
        success: isSuccess,
        message: stdout.trim()
      };
    } catch (error) {
      console.error('❌ Error connecting to wireless device:', error);
      return {
        success: false,
        message: 'Failed to connect to device'
      };
    }
  }

  async disconnectWirelessDevice(ipAddress: string, port: string = '5555'): Promise<{ success: boolean; message: string }> {
    try {
      const { stdout } = await execAsync(`adb disconnect ${ipAddress}:${port}`);
      return {
        success: true,
        message: stdout.trim()
      };
    } catch (error) {
      console.error('Error disconnecting wireless device:', error);
      return {
        success: false,
        message: 'Failed to disconnect device'
      };
    }
  }

  async getDevices(): Promise<Device[]> {
    console.log('🔍 Scanning for connected devices...');
    try {
      const { stdout } = await execAsync('adb devices -l');
      const lines = stdout.split('\n').slice(1);
      
      const devices: Device[] = [];
      console.log(`📱 Found ${lines.filter(line => line.trim()).length} device(s)`);
      
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
              const [
                model,
                androidVersion,
                product,
                manufacturer,
                serialNumber,
                batteryLevel,
                ipAddress
              ] = await Promise.all([
                this.getDeviceProperty(id, 'ro.product.model'),
                this.getDeviceProperty(id, 'ro.build.version.release'),
                this.getDeviceProperty(id, 'ro.product.name'),
                this.getDeviceProperty(id, 'ro.product.manufacturer'),
                this.getDeviceProperty(id, 'ro.serialno'),
                this.getBatteryLevel(id),
                this.getDeviceIpAddress(id)
              ]);

              device.model = model || 'Unknown Model';
              device.androidVersion = androidVersion || 'Unknown Version';
              device.product = product || 'Unknown Product';
              device.manufacturer = manufacturer || 'Unknown Manufacturer';
              device.serialNumber = serialNumber || id;
              device.batteryLevel = batteryLevel;
              device.ipAddress = ipAddress;
            }
            
            devices.push(device);
          }
        }
      }
      
      console.log('✅ Device scan completed successfully');
      return devices;
    } catch (error) {
      console.error('❌ Error listing devices:', error);
      throw new Error('Failed to list ADB devices');
    }
  }
}

export default ADBManager; 
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

export interface FileEntry {
  name: string;
  type: 'file' | 'directory';
  size?: string;
  lastModified?: string;
  permissions?: string;
}

export interface AppInfo {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: string;
  installTime: string;
  lastUpdateTime: string;
  size: string;
  isSystemApp: boolean;
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

  async listFiles(deviceId: string, path: string = '/'): Promise<FileEntry[]> {
    try {
      const { stdout } = await execAsync(`adb -s ${deviceId} shell ls -la ${path}`);
      const lines = stdout.split('\n');
      const files: FileEntry[] = [];

      for (const line of lines) {
        if (!line.trim() || line.includes('total')) continue;

        const parts = line.trim().split(/\s+/);
        if (parts.length >= 8) {
          const permissions = parts[0];
          const size = parts[4];
          const lastModified = `${parts[5]} ${parts[6]} ${parts[7]}`;
          const name = parts.slice(8).join(' ');
          
          if (name === '.' || name === '..') continue;

          files.push({
            name,
            type: permissions.startsWith('d') ? 'directory' : 'file',
            size,
            lastModified,
            permissions
          });
        }
      }

      return files;
    } catch (error) {
      console.error(`Error listing files for device ${deviceId}:`, error);
      throw error;
    }
  }

  async uploadFile(deviceId: string, localPath: string, remotePath: string): Promise<void> {
    try {
      await execAsync(`adb -s ${deviceId} push "${localPath}" "${remotePath}"`);
    } catch (error) {
      console.error(`Error uploading file to device ${deviceId}:`, error);
      throw error;
    }
  }

  async downloadFile(deviceId: string, remotePath: string, localPath: string): Promise<void> {
    try {
      await execAsync(`adb -s ${deviceId} pull "${remotePath}" "${localPath}"`);
    } catch (error) {
      console.error(`Error downloading file from device ${deviceId}:`, error);
      throw error;
    }
  }

  async deleteFile(deviceId: string, path: string): Promise<void> {
    try {
      await execAsync(`adb -s ${deviceId} shell rm -rf "${path}"`);
    } catch (error) {
      console.error(`Error deleting file on device ${deviceId}:`, error);
      throw error;
    }
  }

  async createDirectory(deviceId: string, path: string): Promise<void> {
    try {
      await execAsync(`adb -s ${deviceId} shell mkdir -p "${path}"`);
    } catch (error) {
      console.error(`Error creating directory on device ${deviceId}:`, error);
      throw error;
    }
  }

  async getInstalledApps(deviceId: string): Promise<AppInfo[]> {
    try {
      // Get list of packages with more details
      const { stdout: packages } = await execAsync(
        `adb -s ${deviceId} shell cmd package list packages -f -3 -U`
      );
      
      const apps: AppInfo[] = [];
      const packageLines = packages.split('\n');
      
      for (const line of packageLines) {
        if (!line.trim()) continue;
        
        // Extract package name from line
        const match = line.match(/package:(.+)=(.+)/);
        if (!match) continue;
        
        const apkPath = match[1];
        const packageName = match[2];
        
        try {
          // Get app label using aapt instead of pm dump
          const { stdout: appInfo } = await execAsync(
            `adb -s ${deviceId} shell dumpsys package ${packageName} | grep -E "versionName|versionCode|firstInstallTime|lastUpdateTime|flags"`
          );
          
          // Parse app info
          const versionName = appInfo.match(/versionName=([^\s]+)/)?.[1] || '';
          const versionCode = appInfo.match(/versionCode=([^\s]+)/)?.[1] || '';
          const firstInstallTime = appInfo.match(/firstInstallTime=([^\s]+)/)?.[1] || '';
          const lastUpdateTime = appInfo.match(/lastUpdateTime=([^\s]+)/)?.[1] || '';
          const isSystemApp = appInfo.includes('SYSTEM');
          
          // Get app name using package manager
          const { stdout: appLabel } = await execAsync(
            `adb -s ${deviceId} shell cmd package get-app-label ${packageName}`
          ).catch(() => ({ stdout: packageName }));
          
          // Get app size
          const { stdout: appSize } = await execAsync(
            `adb -s ${deviceId} shell du -h ${apkPath}`
          ).catch(() => ({ stdout: 'Unknown\t' }));
          
          apps.push({
            packageName,
            appName: appLabel.trim() || packageName,
            versionName,
            versionCode,
            installTime: firstInstallTime,
            lastUpdateTime,
            size: appSize.split('\t')[0] || 'Unknown',
            isSystemApp
          });
        } catch (error) {
          // If we fail to get detailed info, add basic info
          apps.push({
            packageName,
            appName: packageName,
            versionName: '',
            versionCode: '',
            installTime: '',
            lastUpdateTime: '',
            size: 'Unknown',
            isSystemApp: false
          });
          console.error(`Error getting info for package ${packageName}:`, error);
        }
      }
      
      // Sort apps by name
      return apps.sort((a, b) => a.appName.localeCompare(b.appName));
    } catch (error) {
      console.error(`Error listing installed apps for device ${deviceId}:`, error);
      throw error;
    }
  }

  async installApp(deviceId: string, apkPath: string): Promise<void> {
    try {
      await execAsync(`adb -s ${deviceId} install "${apkPath}"`);
    } catch (error) {
      console.error(`Error installing app on device ${deviceId}:`, error);
      throw error;
    }
  }

  async uninstallApp(deviceId: string, packageName: string): Promise<void> {
    try {
      await execAsync(`adb -s ${deviceId} uninstall "${packageName}"`);
    } catch (error) {
      console.error(`Error uninstalling app from device ${deviceId}:`, error);
      throw error;
    }
  }

  async clearAppData(deviceId: string, packageName: string): Promise<void> {
    try {
      await execAsync(`adb -s ${deviceId} shell pm clear "${packageName}"`);
    } catch (error) {
      console.error(`Error clearing app data on device ${deviceId}:`, error);
      throw error;
    }
  }

  async forceStopApp(deviceId: string, packageName: string): Promise<void> {
    try {
      await execAsync(`adb -s ${deviceId} shell am force-stop "${packageName}"`);
    } catch (error) {
      console.error(`Error force stopping app on device ${deviceId}:`, error);
      throw error;
    }
  }

  async getAppInfo(deviceId: string, packageName: string): Promise<AppInfo> {
    try {
      const { stdout: info } = await execAsync(
        `adb -s ${deviceId} shell dumpsys package ${packageName}`
      );
      
      const versionName = info.match(/versionName=([^\s]+)/)?.[1] || '';
      const versionCode = info.match(/versionCode=([^\s]+)/)?.[1] || '';
      const firstInstallTime = info.match(/firstInstallTime=([^\s]+)/)?.[1] || '';
      const lastUpdateTime = info.match(/lastUpdateTime=([^\s]+)/)?.[1] || '';
      
      // Use cmd package get-app-label as a more reliable way to get app name
      const { stdout: appLabel } = await execAsync(
        `adb -s ${deviceId} shell cmd package get-app-label ${packageName}`
      ).catch(() => ({ stdout: packageName }));
      
      // Get all APK paths including split APKs
      const { stdout: apkPaths } = await execAsync(
        `adb -s ${deviceId} shell pm path ${packageName}`
      );
      
      // Calculate total size by summing up all APK files
      let totalSize = 0;
      const paths = apkPaths.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace('package:', '').trim());
      
      for (const path of paths) {
        try {
          const { stdout: sizeOutput } = await execAsync(
            `adb -s ${deviceId} shell stat -c "%s" "${path}"`
          );
          totalSize += parseInt(sizeOutput.trim(), 10);
        } catch (error) {
          console.error(`Error getting size for ${path}:`, error);
        }
      }
      
      // Convert bytes to human readable format
      const size = totalSize > 0 ? this.formatSize(totalSize) : 'Unknown';
      
      return {
        packageName,
        appName: appLabel.trim() || packageName,
        versionName,
        versionCode,
        installTime: firstInstallTime,
        lastUpdateTime,
        size,
        isSystemApp: info.includes('FLAG_SYSTEM')
      };
    } catch (error) {
      console.error(`Error getting app info for package ${packageName} on device ${deviceId}:`, error);
      throw error;
    }
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }

  async getBasicAppList(deviceId: string): Promise<AppInfo[]> {
    try {
      const { stdout: packages } = await execAsync(
        `adb -s ${deviceId} shell pm list packages -3`
      );
      
      const apps = packages.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const packageName = line.replace('package:', '').trim();
          return {
            packageName,
            appName: packageName,
            versionName: '',
            versionCode: '',
            installTime: '',
            lastUpdateTime: '',
            size: 'Loading...',
            isSystemApp: false
          };
        });
      
      return apps.sort((a, b) => a.packageName.localeCompare(b.packageName));
    } catch (error) {
      console.error(`Error getting basic app list for device ${deviceId}:`, error);
      throw error;
    }
  }

  async getAppDetails(deviceId: string, packageName: string): Promise<Partial<AppInfo>> {
    try {
      // Get app info
      const { stdout: appInfo } = await execAsync(
        `adb -s ${deviceId} shell dumpsys package ${packageName} | grep -E "versionName|versionCode|firstInstallTime|lastUpdateTime|flags"`
      );
      
      // Get app name
      const { stdout: appLabel } = await execAsync(
        `adb -s ${deviceId} shell cmd package get-app-label ${packageName}`
      ).catch(() => ({ stdout: packageName }));

      // Get APK path
      const { stdout: pathInfo } = await execAsync(
        `adb -s ${deviceId} shell pm path ${packageName}`
      );
      const apkPath = pathInfo.replace('package:', '').trim();

      // Get app size
      const { stdout: appSize } = await execAsync(
        `adb -s ${deviceId} shell du -h ${apkPath}`
      ).catch(() => ({ stdout: 'Unknown\t' }));

      return {
        appName: appLabel.trim() || packageName,
        versionName: appInfo.match(/versionName=([^\s]+)/)?.[1] || '',
        versionCode: appInfo.match(/versionCode=([^\s]+)/)?.[1] || '',
        installTime: appInfo.match(/firstInstallTime=([^\s]+)/)?.[1] || '',
        lastUpdateTime: appInfo.match(/lastUpdateTime=([^\s]+)/)?.[1] || '',
        size: appSize.split('\t')[0] || 'Unknown',
        isSystemApp: appInfo.includes('SYSTEM')
      };
    } catch (error) {
      console.error(`Error getting details for package ${packageName}:`, error);
      return {};
    }
  }

  async takeScreenshot(deviceId: string): Promise<string> {
    try {
      const timestamp = new Date().getTime();
      const remotePath = `/sdcard/screenshot_${timestamp}.png`;
      const localPath = `/tmp/screenshot_${timestamp}.png`;

      // Take screenshot
      await execAsync(`adb -s ${deviceId} shell screencap -p ${remotePath}`);
      // Pull the file
      await execAsync(`adb -s ${deviceId} pull ${remotePath} ${localPath}`);
      // Clean up remote file
      await execAsync(`adb -s ${deviceId} shell rm ${remotePath}`);

      return localPath;
    } catch (error) {
      console.error('Error taking screenshot:', error);
      throw new Error('Failed to take screenshot');
    }
  }

  async startScreenRecording(deviceId: string): Promise<string> {
    try {
      const timestamp = new Date().getTime();
      const remotePath = `/sdcard/recording_${timestamp}.mp4`;
      
      // Start screen recording
      await execAsync(`adb -s ${deviceId} shell screenrecord ${remotePath}`);
      return remotePath;
    } catch (error) {
      console.error('Error starting screen recording:', error);
      throw new Error('Failed to start screen recording');
    }
  }

  async stopScreenRecording(deviceId: string, remotePath: string): Promise<string> {
    try {
      // Kill the screenrecord process
      await execAsync(`adb -s ${deviceId} shell pkill -l SIGINT screenrecord`);
      
      // Wait for the file to be saved
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const localPath = `/tmp/${remotePath.split('/').pop()}`;
      // Pull the recording
      await execAsync(`adb -s ${deviceId} pull ${remotePath} ${localPath}`);
      // Clean up remote file
      await execAsync(`adb -s ${deviceId} shell rm ${remotePath}`);

      return localPath;
    } catch (error) {
      console.error('Error stopping screen recording:', error);
      throw new Error('Failed to stop screen recording');
    }
  }

  async rebootDevice(deviceId: string, mode?: 'system' | 'recovery' | 'bootloader'): Promise<void> {
    try {
      const command = mode ? `adb -s ${deviceId} reboot ${mode}` : `adb -s ${deviceId} reboot`;
      await execAsync(command);
    } catch (error) {
      console.error('Error rebooting device:', error);
      throw new Error('Failed to reboot device');
    }
  }

  async executeShellCommand(deviceId: string, command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`adb -s ${deviceId} shell ${command}`);
      return stdout;
    } catch (error) {
      console.error('Error executing shell command:', error);
      throw new Error('Failed to execute shell command');
    }
  }

  async getLogcat(deviceId: string, options: { 
    filter?: string, 
    lines?: number 
  } = {}): Promise<string> {
    try {
      let command = `adb -s ${deviceId} logcat -d`;
      if (options.filter) {
        command += ` | grep "${options.filter}"`;
      }
      if (options.lines) {
        command += ` | tail -n ${options.lines}`;
      }
      const { stdout } = await execAsync(command);
      return stdout;
    } catch (error) {
      console.error('Error getting logcat:', error);
      throw new Error('Failed to get logcat');
    }
  }

  async getSystemInfo(deviceId: string): Promise<{
    cpuInfo: string;
    memInfo: string;
    diskInfo: string;
    processes: string;
  }> {
    try {
      const [cpuInfo, memInfo, diskInfo, processes] = await Promise.all([
        this.executeShellCommand(deviceId, 'cat /proc/cpuinfo'),
        this.executeShellCommand(deviceId, 'cat /proc/meminfo'),
        this.executeShellCommand(deviceId, 'df -h'),
        this.executeShellCommand(deviceId, 'ps')
      ]);

      return {
        cpuInfo,
        memInfo,
        diskInfo,
        processes
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      throw new Error('Failed to get system info');
    }
  }

  async getPageSource(deviceId: string): Promise<string> {
    try {
      const timestamp = new Date().getTime();
      const remotePath = `/sdcard/window_dump_${timestamp}.xml`;
      
      // Dump the current window hierarchy
      await execAsync(`adb -s ${deviceId} shell uiautomator dump ${remotePath}`);
      
      // Read the file content
      const { stdout } = await execAsync(`adb -s ${deviceId} shell cat ${remotePath}`);
      
      // Clean up the remote file
      await execAsync(`adb -s ${deviceId} shell rm ${remotePath}`);
      
      return stdout;
    } catch (error) {
      console.error('Error getting page source:', error);
      throw new Error('Failed to get page source');
    }
  }

  async getAppActivities(deviceId: string, packageName: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(
        `adb -s ${deviceId} shell dumpsys package ${packageName} | grep -A 1000 "Activity Resolver Table:" | grep -B 1000 "Receiver Resolver Table"`
      );
      
      const activities = stdout
        .split('\n')
        .filter(line => line.includes(`${packageName}/`))
        .map(line => {
          const match = line.match(new RegExp(`${packageName}/([^\\s]+)`));
          return match ? match[1] : null;
        })
        .filter((activity): activity is string => activity !== null);

      return [...new Set(activities)]; // Remove duplicates
    } catch (error) {
      console.error(`Error getting activities for package ${packageName}:`, error);
      throw new Error('Failed to get app activities');
    }
  }

  async startActivity(deviceId: string, packageName: string, activityName: string): Promise<void> {
    try {
      const fullActivityName = activityName.includes('.') ? activityName : `.${activityName}`;
      await execAsync(
        `adb -s ${deviceId} shell am start -n "${packageName}/${packageName}${fullActivityName}"`
      );
    } catch (error) {
      console.error(`Error starting activity ${activityName} for package ${packageName}:`, error);
      throw new Error('Failed to start activity');
    }
  }

  async openDeepLink(deviceId: string, url: string): Promise<void> {
    try {
      await execAsync(
        `adb -s ${deviceId} shell am start -a android.intent.action.VIEW -d "${url}"`
      );
    } catch (error) {
      console.error(`Error opening deep link ${url} on device ${deviceId}:`, error);
      throw new Error('Failed to open deep link');
    }
  }
}

export default ADBManager; 
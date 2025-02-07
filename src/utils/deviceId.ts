export function encodeDeviceId(deviceId: string): string {
  return Buffer.from(deviceId).toString('base64');
}

export function decodeDeviceId(encodedDeviceId: string): string {
  return Buffer.from(encodedDeviceId, 'base64').toString();
} 
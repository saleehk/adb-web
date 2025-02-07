import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

interface CacheData<T> {
  data: T;
  timestamp: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cacheDir: string;
  private ttl: number;

  private constructor() {
    this.cacheDir = join(process.cwd(), '.cache');
    // Default TTL is 24 hours
    this.ttl = 24 * 60 * 60 * 1000;
    this.initializeCache();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private async initializeCache() {
    if (!existsSync(this.cacheDir)) {
      await mkdir(this.cacheDir, { recursive: true });
    }
  }

  private getCacheFilePath(key: string): string {
    return join(this.cacheDir, `${Buffer.from(key).toString('base64')}.json`);
  }

  public async set<T>(key: string, data: T): Promise<void> {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
    };
    const filePath = this.getCacheFilePath(key);
    await writeFile(filePath, JSON.stringify(cacheData), 'utf-8');
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const filePath = this.getCacheFilePath(key);
      if (!existsSync(filePath)) {
        return null;
      }

      const fileContent = await readFile(filePath, 'utf-8');
      const cacheData: CacheData<T> = JSON.parse(fileContent);

      // Check if cache is expired
      if (Date.now() - cacheData.timestamp > this.ttl) {
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }
} 
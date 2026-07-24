class RedisCacheSimulator {
  private cache = new Map<string, { value: any; expiry: number }>();

  public get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  public set(key: string, value: any, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }
}

export const redisCache = new RedisCacheSimulator();

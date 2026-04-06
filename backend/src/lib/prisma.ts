// AnyFix – src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global { var __prisma: PrismaClient | undefined; }

export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query','warn','error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma;

// ─── src/lib/redis.ts ─────────────────────────────────────
import { Redis } from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on('error', (err) => console.error('[Redis]', err));

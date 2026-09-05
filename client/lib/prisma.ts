import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prismaClientSingleton = () => {
  if (process.env.VERCEL) {
    // On Vercel, SQLite database file must be copied to /tmp which is writable
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const tmpDbPath = '/tmp/dev.db';
    try {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tmpDbPath);
      }
    } catch (e) {
      console.error("Failed to copy dev.db to /tmp", e);
    }
    return new PrismaClient({
      datasources: {
        db: {
          url: 'file:/tmp/dev.db',
        },
      },
    });
  }
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

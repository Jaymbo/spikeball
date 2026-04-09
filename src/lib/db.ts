import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'], // Nur Fehler loggen, keine Queries (reduziert Terminal-Spam)
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
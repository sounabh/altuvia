// prisma.config.ts
// Note: This file is only needed for Prisma 7+
// If you're on an earlier version, you can delete this file

export default {
  adapter: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  migrate: {
    directUrl: process.env.DIRECT_URL,
  },
}
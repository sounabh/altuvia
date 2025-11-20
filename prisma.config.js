// prisma.config.js (CommonJS version for Vercel)
// Prisma 7+ config

const config = {
  adapter: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  migrate: {
    directUrl: process.env.DIRECT_URL,
  },
};

module.exports = config;

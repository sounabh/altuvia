// prisma.config.js
export const adapter = {
  provider: 'postgresql',
  url: process.env.DATABASE_URL,
};
export const migrate = {
  directUrl: process.env.DIRECT_URL,
};
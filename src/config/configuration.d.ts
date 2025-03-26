export default () => ({
  apiPort: process.env.API_PORT,
  dbUrl: process.env.DATABASE_URL,
  corsOrigin: process.env.CORS_ORIGIN,
});

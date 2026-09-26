import { app } from './app';
import { env } from './config/env';
import { prisma } from './db/prisma';

const PORT = env.PORT || 5000;

async function main() {
  try {
    // Check DB connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL + PostGIS database successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 VanSetu Backend API running on port ${PORT} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

main();

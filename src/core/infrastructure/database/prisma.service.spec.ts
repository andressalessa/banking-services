import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL =
      originalDatabaseUrl ??
      'postgresql://test_user:test_pass@localhost:5432/test_db';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('should refuse to truncate tables in production', async () => {
    process.env.NODE_ENV = 'production';
    const prisma = new PrismaService();

    await expect(prisma.cleanDatabase()).rejects.toThrow(
      'cleanDatabase cannot be used in production.',
    );
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';

describe('Auth & RBAC Endpoints (Phase 1)', () => {
  const testUser = {
    name: 'Test Officer',
    email: `test.officer.${Date.now()}@vansetu.in`,
    password: 'SecurePassword123!',
    role: 'FIELD_OFFICER',
    districtId: 'DIST_TEST_01',
  };

  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup created test user
    await prisma.user.deleteMany({ where: { email: { contains: 'test.officer' } } });
    await prisma.$disconnect();
  });

  it('should register a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.role).toBe('FIELD_OFFICER');
  });

  it('should prevent registration of existing email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should login and return access & refresh tokens', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('should enforce brute force lockout on 5 failed password attempts', async () => {
    const badUserEmail = `lockout.${Date.now()}@vansetu.in`;
    await request(app).post('/api/auth/register').send({
      name: 'Lockout Target',
      email: badUserEmail,
      password: 'CorrectPassword123!',
      role: 'CITIZEN',
    });

    // Make 5 wrong attempts
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({
        email: badUserEmail,
        password: 'WrongPassword!',
      });
    }

    // 6th attempt should be blocked by account lockout
    const res = await request(app).post('/api/auth/login').send({
      email: badUserEmail,
      password: 'CorrectPassword123!',
    });

    expect(res.status).toBe(429);
    expect(res.body.error).toContain('locked');
  });

  it('should allow access to protected /me endpoint with valid access token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('should enforce RBAC role authorization correctly', async () => {
    // FIELD_OFFICER can access /test/officer
    const officerRes = await request(app)
      .get('/api/auth/test/officer')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(officerRes.status).toBe(200);

    // FIELD_OFFICER cannot access /test/admin (requires DISTRICT_ADMIN or STATE_ADMIN)
    const adminRes = await request(app)
      .get('/api/auth/test/admin')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(adminRes.status).toBe(403);
  });

  it('should rotate refresh token and revoke original token server-side on logout', async () => {
    // Refresh access token
    const refreshRes = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    const newRefreshToken = refreshRes.body.data.refreshToken;

    // Logout and revoke new refresh token
    const logoutRes = await request(app).post('/api/auth/logout').send({ refreshToken: newRefreshToken });
    expect(logoutRes.status).toBe(200);

    // Attempting to reuse revoked refresh token should fail with 401
    const failRefresh = await request(app).post('/api/auth/refresh').send({ refreshToken: newRefreshToken });
    expect(failRefresh.status).toBe(401);
  });
});

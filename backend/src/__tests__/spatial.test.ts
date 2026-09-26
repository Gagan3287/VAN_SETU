import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';

describe('GIS & Spatial Endpoints (Phase 2)', () => {
  let citizenToken: string;
  let adminToken: string;
  let citizenUserId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Login as Citizen
    const citRes = await request(app).post('/api/auth/login').send({
      email: 'citizen@vansetu.in',
      password: 'Password123!',
    });
    citizenToken = citRes.body.data.tokens.accessToken;
    citizenUserId = citRes.body.data.user.id;

    // Login as State Admin
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin.state@vansetu.in',
      password: 'Password123!',
    });
    adminToken = adminRes.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return district boundary GeoJSON', async () => {
    const res = await request(app).get('/api/geo/districts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('FeatureCollection');
    expect(res.body.data.features.length).toBeGreaterThanOrEqual(2);
  });

  it('should return tehsils filtered by districtId', async () => {
    const res = await request(app).get('/api/geo/tehsils?districtId=DIST_OD_KANDHAMAL');
    expect(res.status).toBe(200);
    expect(res.body.data.features.length).toBe(2);
    expect(res.body.data.features[0].properties.parentId).toBe('DIST_OD_KANDHAMAL');
  });

  it('should return PII-free spatial claims GeoJSON for State Admin', async () => {
    const res = await request(app)
      .get('/api/claims/spatial')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('FeatureCollection');
    expect(res.body.data.features.length).toBeGreaterThanOrEqual(18);

    // Verify PII-free rule (Blueprint §17)
    const sampleProps = res.body.data.features[0].properties;
    expect(sampleProps).toHaveProperty('claimNumber');
    expect(sampleProps).toHaveProperty('claimType');
    expect(sampleProps).toHaveProperty('status');
    expect(sampleProps).toHaveProperty('riskLevel');

    // Strict assertion: NO claimant PII
    expect(sampleProps).not.toHaveProperty('claimantName');
    expect(sampleProps).not.toHaveProperty('name');
    expect(sampleProps).not.toHaveProperty('email');
    expect(sampleProps).not.toHaveProperty('phone');
  });

  it('should enforce role-scoping on /api/claims/spatial for Citizen (Blueprint §15)', async () => {
    const res = await request(app)
      .get('/api/claims/spatial')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Citizen should see ONLY their own claims, not all 18
    expect(res.body.data.features.length).toBeLessThan(18);
  });

  it('should return full claim details including claimant PII on GET /api/claims/:id', async () => {
    // Get sample claim ID
    const spatialRes = await request(app)
      .get('/api/claims/spatial')
      .set('Authorization', `Bearer ${adminToken}`);
    const sampleId = spatialRes.body.data.features[0].properties.id;

    const detailRes = await request(app)
      .get(`/api/claims/${sampleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data).toHaveProperty('claimant');
    expect(detailRes.body.data.claimant).toHaveProperty('name');
    expect(detailRes.body.data.claimant).toHaveProperty('email');
  });
});

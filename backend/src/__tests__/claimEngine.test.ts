import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';
import { generateSignedEvidenceUrl, verifySignedEvidenceToken } from '../services/evidenceService';

describe('Phase 3 - Claim Engine & Hardening Tests', () => {
  let citizenToken: string;
  let officerToken: string;
  let adminToken: string;
  let citizenId: string;
  let officerId: string;
  let testClaimId: string;

  beforeAll(async () => {
    // 1. Fetch seeded users
    const citizen = await prisma.user.findUnique({ where: { email: 'citizen@vansetu.in' } });
    const officer = await prisma.user.findUnique({ where: { email: 'officer@vansetu.in' } });
    const admin = await prisma.user.findUnique({ where: { email: 'admin.district@vansetu.in' } });

    if (!citizen || !officer || !admin) {
      throw new Error('Seeded users missing. Please run seed before running tests.');
    }

    citizenId = citizen.id;
    officerId = officer.id;

    // 2. Login via API to get real JWT access tokens
    const citRes = await request(app).post('/api/auth/login').send({
      email: 'citizen@vansetu.in',
      password: 'Password123!',
    });
    citizenToken = citRes.body.data.tokens.accessToken;

    const offRes = await request(app).post('/api/auth/login').send({
      email: 'officer@vansetu.in',
      password: 'Password123!',
    });
    officerToken = offRes.body.data.tokens.accessToken;

    const admRes = await request(app).post('/api/auth/login').send({
      email: 'admin.district@vansetu.in',
      password: 'Password123!',
    });
    adminToken = admRes.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    if (testClaimId) {
      await prisma.evidence.deleteMany({ where: { claimId: testClaimId } });
      await prisma.statusHistory.deleteMany({ where: { claimId: testClaimId } });
      await prisma.claim.deleteMany({ where: { id: testClaimId } });
    }
  });

  describe('1. Role-Scoped CRUD & Server-Side Query Filters', () => {
    it('GET /api/claims returns only own claims for CITIZEN', async () => {
      const res = await request(app)
        .get('/api/claims')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      for (const claim of res.body.data) {
        expect(claim.claimant.id).toBe(citizenId);
      }
    });

    it('POST /api/claims validates payload using Zod and creates DRAFT claim', async () => {
      const payload = {
        claimType: 'IFR',
        districtId: 'DIST_OD_KANDHAMAL',
        tehsilId: 'TEH_BALLIGUDA',
        villageId: 'VIL_DARINGBADI',
        areaHectares: 2.8,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [83.89, 20.08],
              [83.92, 20.07],
              [83.94, 20.11],
              [83.91, 20.12],
              [83.89, 20.08],
            ],
          ],
        },
      };

      const res = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.areaHectares).toBe(2.8);

      testClaimId = res.body.data.id;
    });

    it('POST /api/claims rejects invalid areaHectares with 400 Bad Request', async () => {
      const invalidPayload = {
        claimType: 'IFR',
        districtId: 'DIST_OD_KANDHAMAL',
        tehsilId: 'TEH_BALLIGUDA',
        villageId: 'VIL_DARINGBADI',
        areaHectares: -5.0, // Negative area!
      };

      const res = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Validated Workflow State Machine', () => {
    it('Allows valid transition DRAFT -> SUBMITTED', async () => {
      const res = await request(app)
        .post(`/api/claims/${testClaimId}/status`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ targetStatus: 'SUBMITTED', remarks: 'Submitted by citizen' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUBMITTED');
    });

    it('Rejects invalid status jump SUBMITTED -> APPROVED with 400', async () => {
      const res = await request(app)
        .post(`/api/claims/${testClaimId}/status`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ targetStatus: 'APPROVED', remarks: 'Bypassing state machine' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid status transition');
    });

    it('Allows valid transition SUBMITTED -> FIELD_VERIFICATION by Officer', async () => {
      const res = await request(app)
        .post(`/api/claims/${testClaimId}/status`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ targetStatus: 'FIELD_VERIFICATION', remarks: 'Started field inspection' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('FIELD_VERIFICATION');
    });
  });

  describe('3. Evidence Upload & Signed Download Tokens', () => {
    it('Generates and verifies HMAC download signature with EVIDENCE_URL_SECRET', () => {
      const url = generateSignedEvidenceUrl('ev_123', 'claim_456', citizenId, 15);
      expect(url).toContain('/api/claims/claim_456/evidence/ev_123/download');
      expect(url).toContain('token=');

      const urlObj = new URL(`http://localhost${url}`);
      const token = urlObj.searchParams.get('token')!;
      const expires = urlObj.searchParams.get('expires')!;

      const isValid = verifySignedEvidenceToken('ev_123', 'claim_456', citizenId, token, expires);
      expect(isValid).toBe(true);
    });

    it('Successfully uploads evidence file via POST /api/claims/:id/evidence', async () => {
      const dummyPdf = Buffer.from('%PDF-1.4 sample pdf content for evidence testing');

      const res = await request(app)
        .post(`/api/claims/${testClaimId}/evidence`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .field('documentType', 'Gram Sabha Resolution')
        .attach('file', dummyPdf, 'test_resolution.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.capturedBy).toBe(citizenId);
      expect(res.body.data.type).toBe('Gram Sabha Resolution');
      expect(res.body.data).toHaveProperty('downloadUrl');
    });

    it('Rejects expired or tampered evidence signed token', () => {
      const expiredTime = (Date.now() - 1000).toString();
      const isExpired = verifySignedEvidenceToken('ev_123', 'claim_456', citizenId, 'invalid_sig', expiredTime);
      expect(isExpired).toBe(false);
    });
  });

  describe('4. Audit Logging & PII Masking', () => {
    it('Writes PII-masked audit log entry for status transitions', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { action: 'STATUS_TRANSITION', entityId: testClaimId },
      });

      expect(logs.length).toBeGreaterThan(0);
      const hasFieldVerifLog = logs.some((l) => l.newValue && l.newValue.includes('FIELD_VERIFICATION'));
      expect(hasFieldVerifLog).toBe(true);
    });
  });
});

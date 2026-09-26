/**
 * riskEngine.test.ts
 *
 * Phase 5 — Risk Engine Unit & Integration Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';
import { ConflictSeverity, ConflictStatus } from '@prisma/client';
import {
  computeRiskScore,
  bandRiskLevel,
  computeConflictSubScore,
  computeDelaySubScore,
  computeEvidenceSubScore,
  computeCorrectionSubScore,
  computeGeoRiskSubScore,
} from '../services/riskService';

describe('Phase 5 — Risk Engine Tests', () => {
  let citizenToken: string;
  let officerToken: string;
  let adminToken: string;
  let stateAdminToken: string;
  let testClaimId: string;

  beforeAll(async () => {
    // Authenticate seeded users
    const [citRes, offRes, admRes, stateRes] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'citizen@vansetu.in', password: 'Password123!' }),
      request(app).post('/api/auth/login').send({ email: 'officer@vansetu.in', password: 'Password123!' }),
      request(app).post('/api/auth/login').send({ email: 'admin.district@vansetu.in', password: 'Password123!' }),
      request(app).post('/api/auth/login').send({ email: 'admin.state@vansetu.in', password: 'Password123!' }),
    ]);

    citizenToken = citRes.body.data?.tokens?.accessToken;
    officerToken = offRes.body.data?.tokens?.accessToken;
    adminToken = admRes.body.data?.tokens?.accessToken;
    stateAdminToken = stateRes.body.data?.tokens?.accessToken;

    const firstClaim = await prisma.claim.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!firstClaim) throw new Error('No claims found in database. Please run seed first.');
    testClaimId = firstClaim.id;
  });

  // ---------------------------------------------------------------------------
  // 1. Pure-function unit tests: Individual factor sub-score functions
  // ---------------------------------------------------------------------------
  describe('1. Individual Factor Sub-Score Functions', () => {
    it('computeConflictSubScore: max severity strategy (not sum)', () => {
      expect(computeConflictSubScore([]).subScore).toBe(0);
      expect(computeConflictSubScore([ConflictSeverity.LOW]).subScore).toBe(20);
      expect(computeConflictSubScore([ConflictSeverity.MEDIUM]).subScore).toBe(60);
      expect(computeConflictSubScore([ConflictSeverity.HIGH]).subScore).toBe(100);
      // Max strategy test: LOW + HIGH -> 100 (not 120)
      expect(
        computeConflictSubScore([ConflictSeverity.LOW, ConflictSeverity.HIGH]).subScore
      ).toBe(100);
    });

    it('computeDelaySubScore: SLA threshold banding', () => {
      expect(computeDelaySubScore(null).subScore).toBe(0);

      const now = Date.now();
      const dayMs = 86400000;

      expect(computeDelaySubScore(new Date(now - 10 * dayMs)).subScore).toBe(0); // <30d
      expect(computeDelaySubScore(new Date(now - 40 * dayMs)).subScore).toBe(25); // 30–59d
      expect(computeDelaySubScore(new Date(now - 75 * dayMs)).subScore).toBe(50); // 60–89d
      expect(computeDelaySubScore(new Date(now - 100 * dayMs)).subScore).toBe(75); // 90–119d
      expect(computeDelaySubScore(new Date(now - 130 * dayMs)).subScore).toBe(100); // >=120d
    });

    it('computeEvidenceSubScore: missing required category count', () => {
      // 0 missing -> 0
      const allPresent = computeEvidenceSubScore([
        'title deed',
        'gram sabha resolution',
        'photograph',
      ]);
      expect(allPresent.subScore).toBe(0);
      expect(allPresent.missingCategories.length).toBe(0);

      // 1 missing -> 33
      const oneMissing = computeEvidenceSubScore(['land_document', 'gram_sabha_resolution']);
      expect(oneMissing.subScore).toBe(33);
      expect(oneMissing.missingCategories).toContain('PHOTO_EVIDENCE');

      // 3 missing -> 100
      const allMissing = computeEvidenceSubScore([]);
      expect(allMissing.subScore).toBe(100);
      expect(allMissing.missingCategories.length).toBe(3);
    });

    it('computeCorrectionSubScore: NEEDS_CORRECTION transition count', () => {
      expect(computeCorrectionSubScore(0).subScore).toBe(0);
      expect(computeCorrectionSubScore(1).subScore).toBe(40);
      expect(computeCorrectionSubScore(2).subScore).toBe(75);
      expect(computeCorrectionSubScore(3).subScore).toBe(100);
      expect(computeCorrectionSubScore(5).subScore).toBe(100); // Cap at 100
    });

    it('computeGeoRiskSubScore: village conflict density', () => {
      expect(computeGeoRiskSubScore(0).subScore).toBe(0);
      expect(computeGeoRiskSubScore(2).subScore).toBe(40);
      expect(computeGeoRiskSubScore(5).subScore).toBe(100);
      expect(computeGeoRiskSubScore(10).subScore).toBe(100); // Cap at 100
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Pure-function unit tests: bandRiskLevel boundary values
  // ---------------------------------------------------------------------------
  describe('2. bandRiskLevel — 8 Boundary Value Tests', () => {
    it('Score 0 -> LOW', () => expect(bandRiskLevel(0)).toBe('LOW'));
    it('Score 39 -> LOW', () => expect(bandRiskLevel(39)).toBe('LOW'));
    it('Score 40 -> MEDIUM (boundary: exactly 40)', () => expect(bandRiskLevel(40)).toBe('MEDIUM'));
    it('Score 64 -> MEDIUM', () => expect(bandRiskLevel(64)).toBe('MEDIUM'));
    it('Score 65 -> HIGH (boundary: exactly 65)', () => expect(bandRiskLevel(65)).toBe('HIGH'));
    it('Score 89 -> HIGH', () => expect(bandRiskLevel(89)).toBe('HIGH'));
    it('Score 90 -> CRITICAL (boundary: exactly 90)', () => expect(bandRiskLevel(90)).toBe('CRITICAL'));
    it('Score 100 -> CRITICAL', () => expect(bandRiskLevel(100)).toBe('CRITICAL'));
  });

  // ---------------------------------------------------------------------------
  // 3. Pure-function unit tests: End-to-end hand-calculated computeRiskScore
  // ---------------------------------------------------------------------------
  describe('3. computeRiskScore — Hand-Calculated End-to-End Test', () => {
    it('All zero inputs -> score 0, LOW', () => {
      const res = computeRiskScore({
        activeSeverities: [],
        submittedAt: null,
        evidenceTypes: ['land_document', 'gram_sabha_resolution', 'photo_evidence'],
        correctionCount: 0,
        activeConflictsInVillage: 0,
      });
      expect(res.riskScore).toBe(0);
      expect(res.riskLevel).toBe('LOW');
    });

    it('All max inputs -> score 100, CRITICAL', () => {
      const now = Date.now();
      const res = computeRiskScore({
        activeSeverities: [ConflictSeverity.HIGH],
        submittedAt: new Date(now - 150 * 86400000),
        evidenceTypes: [],
        correctionCount: 3,
        activeConflictsInVillage: 5,
      });
      expect(res.riskScore).toBe(100);
      expect(res.riskLevel).toBe('CRITICAL');
    });

    it('Hand-calculated example: 1 HIGH conflict + 95d delay + 1 missing evidence + 1 correction + 2 village conflicts = 65 -> HIGH', () => {
      const now = Date.now();
      const res = computeRiskScore({
        activeSeverities: [ConflictSeverity.HIGH], // 100 * 0.30 = 30.0
        submittedAt: new Date(now - 95 * 86400000), // 75 * 0.25 = 18.75
        evidenceTypes: ['land_document', 'gram_sabha_resolution'], // 1 missing -> 33 * 0.20 = 6.6
        correctionCount: 1, // 40 * 0.15 = 6.0
        activeConflictsInVillage: 2, // 40 * 0.10 = 4.0
      });

      // Total = 30.0 + 18.75 + 6.6 + 6.0 + 4.0 = 65.35 -> rounds to 65 -> HIGH
      expect(res.riskScore).toBe(65);
      expect(res.riskLevel).toBe('HIGH');
      expect(res.breakdown.boundaryConflict.contribution).toBe(30);
      expect(res.breakdown.processingDelay.contribution).toBe(18.75);
      expect(res.breakdown.missingEvidence.contribution).toBe(6.6);
      expect(res.breakdown.correctionHistory.contribution).toBe(6);
      expect(res.breakdown.geographicRisk.contribution).toBe(4);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. HTTP integration tests: GET /api/risk/claim/:id
  // ---------------------------------------------------------------------------
  describe('4. GET /api/risk/claim/:id — Explainable Breakdown API', () => {
    it('Returns 200 with all 5 breakdown factors for authenticated user', async () => {
      const res = await request(app)
        .get(`/api/risk/claim/${testClaimId}`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('riskScore');
      expect(res.body.data).toHaveProperty('riskLevel');

      const breakdown = res.body.data.breakdown;
      expect(breakdown).toHaveProperty('boundaryConflict');
      expect(breakdown).toHaveProperty('processingDelay');
      expect(breakdown).toHaveProperty('missingEvidence');
      expect(breakdown).toHaveProperty('correctionHistory');
      expect(breakdown).toHaveProperty('geographicRisk');
    });

    it('Rejects unauthenticated request with 401', async () => {
      const res = await request(app).get(`/api/risk/claim/${testClaimId}`);
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. HTTP integration tests: GET /api/risk/queue — Role Scoping & Priority Queue
  // ---------------------------------------------------------------------------
  describe('5. GET /api/risk/queue — Role Scoping & Priority Queue', () => {
    it('Rejects Citizen access with 403', async () => {
      const res = await request(app)
        .get('/api/risk/queue')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('Allows Field Officer access scoped to assigned district', async () => {
      const res = await request(app)
        .get('/api/risk/queue')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Verify all returned claims belong to Kandhamal district
      for (const claim of res.body.data) {
        expect(claim.districtId).toBe('DIST_OD_KANDHAMAL');
      }
    });

    it('Allows State Admin to view all claims across districts', async () => {
      const res = await request(app)
        .get('/api/risk/queue')
        .set('Authorization', `Bearer ${stateAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Returns claims ordered by riskScore DESC', async () => {
      const res = await request(app)
        .get('/api/risk/queue')
        .set('Authorization', `Bearer ${stateAdminToken}`);

      expect(res.status).toBe(200);
      const claims = res.body.data;
      if (claims.length > 1) {
        for (let i = 0; i < claims.length - 1; i++) {
          expect(claims[i].riskScore).toBeGreaterThanOrEqual(claims[i + 1].riskScore);
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Manual Conflict Resolution Trigger Test — Required Addition
  // ---------------------------------------------------------------------------
  describe('6. Manual Conflict Resolution Trigger Test', () => {
    it('Recalculates risk score when conflict is manually resolved', async () => {
      // Create two test claims and a pending conflict between them
      const claimA = await prisma.claim.create({
        data: {
          claimNumber: `TEST-RISK-A-${Date.now()}`,
          claimType: 'IFR',
          claimantId: (await prisma.user.findFirst({ where: { role: 'CITIZEN' } }))!.id,
          districtId: 'DIST_OD_KANDHAMAL',
          tehsilId: 'TEH_BALLIGUDA',
          villageId: 'VIL_DARINGBADI',
          status: 'CONFLICT_REVIEW',
          areaHectares: 5.0,
          riskScore: 30,
          riskLevel: 'LOW',
        },
      });

      const claimB = await prisma.claim.create({
        data: {
          claimNumber: `TEST-RISK-B-${Date.now()}`,
          claimType: 'IFR',
          claimantId: (await prisma.user.findFirst({ where: { role: 'CITIZEN' } }))!.id,
          districtId: 'DIST_OD_KANDHAMAL',
          tehsilId: 'TEH_BALLIGUDA',
          villageId: 'VIL_DARINGBADI',
          status: 'FIELD_VERIFICATION',
          areaHectares: 4.0,
          riskScore: 30,
          riskLevel: 'LOW',
        },
      });

      const conflict = await prisma.conflict.create({
        data: {
          claimAId: claimA.id,
          claimBId: claimB.id,
          overlapArea: 2.0,
          overlapPercentage: 40.0,
          severity: ConflictSeverity.HIGH,
          status: ConflictStatus.PENDING,
        },
      });

      // Manually trigger risk score persist for claimA with the active conflict
      const scoreBeforeRes = await request(app)
        .get(`/api/risk/claim/${claimA.id}`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(scoreBeforeRes.body.data.breakdown.boundaryConflict.subScore).toBe(100);

      // Now resolve the conflict as District Admin
      const resolveRes = await request(app)
        .put(`/api/conflicts/${conflict.id}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESOLVED',
          resolutionNote: 'Manually verified boundaries via field inspection',
        });

      expect(resolveRes.status).toBe(200);

      // Refetch risk score for claimA — boundaryConflict subScore must drop to 0
      const scoreAfterRes = await request(app)
        .get(`/api/risk/claim/${claimA.id}`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(scoreAfterRes.body.data.breakdown.boundaryConflict.subScore).toBe(0);

      // Cleanup test data
      await prisma.conflict.delete({ where: { id: conflict.id } });
      await prisma.claim.deleteMany({ where: { id: { in: [claimA.id, claimB.id] } } });
    });
  });
});

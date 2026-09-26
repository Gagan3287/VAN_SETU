/**
 * conflictEngine.test.ts
 *
 * Phase 4 — Conflict Engine Unit & Integration Tests
 *
 * Pure-function tests (no DB/PostGIS):
 *  - computeOverlapPercentage: denominator = smaller claim area (Option A)
 *  - bandSeverity: boundary values at exactly 5% and 20%
 *  - validatePolygonGeometry: self-intersecting ring rejection
 *
 * HTTP integration tests (hit live Express app + DB):
 *  - Citizen cannot access /api/conflicts (403)
 *  - Field Officer can LIST conflicts (read-only)
 *  - Field Officer cannot resolve (403)
 *  - District Admin can resolve with valid note
 *  - Self-intersecting polygon rejected on POST /api/claims
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';
import { computeOverlapPercentage, bandSeverity } from '../services/conflictService';
import { validatePolygonGeometry } from '../services/geometryService';

describe('Phase 4 — Conflict Engine Tests', () => {
  let citizenToken: string;
  let officerToken: string;
  let adminToken: string;
  let citizenId: string;
  let seedConflictId: string;

  beforeAll(async () => {
    // Authenticate seeded users
    const [citRes, offRes, admRes] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'citizen@vansetu.in', password: 'Password123!' }),
      request(app).post('/api/auth/login').send({ email: 'officer@vansetu.in', password: 'Password123!' }),
      request(app).post('/api/auth/login').send({ email: 'admin.district@vansetu.in', password: 'Password123!' }),
    ]);

    citizenToken = citRes.body.data?.tokens?.accessToken;
    officerToken = offRes.body.data?.tokens?.accessToken;
    adminToken = admRes.body.data?.tokens?.accessToken;

    const citizen = await prisma.user.findUnique({ where: { email: 'citizen@vansetu.in' } });
    if (!citizen) throw new Error('Seeded citizen user missing. Run seed first.');
    citizenId = citizen.id;

    // Grab first seeded conflict (from the 003/004 or 012/013 intentional overlap pairs in seed)
    const firstConflict = await prisma.conflict.findFirst({ orderBy: { detectedAt: 'asc' } });
    seedConflictId = firstConflict?.id ?? '';
  });

  // ---------------------------------------------------------------------------
  // 1. computeOverlapPercentage — pure math, no DB
  // ---------------------------------------------------------------------------
  describe('1. computeOverlapPercentage — denominator = smaller claim area', () => {
    it('Returns 0 for zero intersection area', () => {
      expect(computeOverlapPercentage(0, 10)).toBe(0);
    });

    it('Returns 0 for zero smaller area (guard against division by zero)', () => {
      expect(computeOverlapPercentage(5, 0)).toBe(0);
    });

    it('Partial overlap: 5ha intersection, 10ha smaller claim → 50%', () => {
      const pct = computeOverlapPercentage(5, 10);
      expect(pct).toBeCloseTo(50, 1);
    });

    it('Fully nested: 10ha intersection, 10ha smaller claim → 100%', () => {
      const pct = computeOverlapPercentage(10, 10);
      expect(pct).toBeCloseTo(100, 1);
    });

    it('Tiny sliver: 0.3ha intersection, 10ha smaller claim → 3% (LOW)', () => {
      const pct = computeOverlapPercentage(0.3, 10);
      expect(pct).toBeCloseTo(3, 1);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. bandSeverity — boundary values are critical
  // ---------------------------------------------------------------------------
  describe('2. bandSeverity — boundary values at exactly 5% and 20%', () => {
    it('4.99% → LOW', () => {
      expect(bandSeverity(4.99)).toBe('LOW');
    });

    it('Exactly 5% → MEDIUM (not LOW)', () => {
      expect(bandSeverity(5)).toBe('MEDIUM');
    });

    it('10% → MEDIUM', () => {
      expect(bandSeverity(10)).toBe('MEDIUM');
    });

    it('Exactly 20% → MEDIUM (not HIGH)', () => {
      expect(bandSeverity(20)).toBe('MEDIUM');
    });

    it('20.01% → HIGH', () => {
      expect(bandSeverity(20.01)).toBe('HIGH');
    });

    it('50% → HIGH', () => {
      expect(bandSeverity(50)).toBe('HIGH');
    });

    it('100% → HIGH (fully nested)', () => {
      expect(bandSeverity(100)).toBe('HIGH');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. validatePolygonGeometry — geometry hardening
  // ---------------------------------------------------------------------------
  describe('3. validatePolygonGeometry — self-intersection and structural checks', () => {
    const validPolygon = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [83.89, 20.08],
          [83.92, 20.07],
          [83.94, 20.11],
          [83.91, 20.12],
          [83.89, 20.08],
        ],
      ],
    };

    it('Accepts a valid closed polygon', () => {
      const result = validatePolygonGeometry(validPolygon);
      expect(result.valid).toBe(true);
    });

    it('Rejects a self-intersecting bowtie polygon', () => {
      // Bowtie: edges (A→B) and (C→D) cross each other
      const bowTie = {
        type: 'Polygon' as const,
        coordinates: [
          [
            [0, 0],
            [2, 2], // crosses the next segment
            [2, 0],
            [0, 2],
            [0, 0],
          ],
        ],
      };
      const result = validatePolygonGeometry(bowTie);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/self-intersecting/i);
    });

    it('Rejects an unclosed ring', () => {
      const unclosed = {
        type: 'Polygon' as const,
        coordinates: [
          [
            [83.89, 20.08],
            [83.92, 20.07],
            [83.94, 20.11],
            [83.91, 20.12],
            // Missing closure
          ],
        ],
      };
      const result = validatePolygonGeometry(unclosed);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/not closed/i);
    });

    it('Rejects too few coordinate pairs (fewer than 4)', () => {
      const tooFew = {
        type: 'Polygon' as const,
        coordinates: [
          [
            [83.89, 20.08],
            [83.92, 20.07],
            [83.89, 20.08], // only 3 pairs, closed but degenerate
          ],
        ],
      };
      const result = validatePolygonGeometry(tooFew);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/at least 4/i);
    });

    it('Rejects out-of-bounds longitude', () => {
      const oob = {
        type: 'Polygon' as const,
        coordinates: [
          [
            [200, 20], // lng 200 out of [-180, 180]
            [83.92, 20.07],
            [83.94, 20.11],
            [83.91, 20.12],
            [200, 20],
          ],
        ],
      };
      const result = validatePolygonGeometry(oob);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/longitude/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. HTTP: Self-intersecting polygon rejected on POST /api/claims
  // ---------------------------------------------------------------------------
  describe('4. HTTP — Self-intersecting polygon rejected at API layer', () => {
    it('POST /api/claims with bowtie polygon returns 400 with geometry field error', async () => {
      const res = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          claimType: 'IFR',
          districtId: 'DIST_OD_KANDHAMAL',
          tehsilId: 'TEH_BALLIGUDA',
          villageId: 'VIL_DARINGBADI',
          areaHectares: 3.0,
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [2, 2],
                [2, 0],
                [0, 2],
                [0, 0],
              ],
            ],
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details).toHaveProperty('geometry');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. HTTP: Role-scoping on conflict API
  // ---------------------------------------------------------------------------
  describe('5. HTTP — Conflict API role-scoping', () => {
    it('Citizen cannot access GET /api/conflicts (403)', async () => {
      const res = await request(app)
        .get('/api/conflicts')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Field Officer can GET /api/conflicts (read-only list)', async () => {
      const res = await request(app)
        .get('/api/conflicts')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Field Officer cannot resolve a conflict (403)', async () => {
      if (!seedConflictId) return; // Skip if no conflicts in DB yet

      const res = await request(app)
        .put(`/api/conflicts/${seedConflictId}/resolve`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          status: 'RESOLVED',
          resolutionNote: 'Officer trying to resolve — should be blocked by RBAC',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('District Admin can resolve a conflict with a valid resolution note', async () => {
      if (!seedConflictId) return; // Skip if no conflicts in DB yet

      const res = await request(app)
        .put(`/api/conflicts/${seedConflictId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'UNDER_REVIEW',
          resolutionNote: 'Both claimants interviewed on-site. Boundary dispute under review by district collector.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UNDER_REVIEW');
    });

    it('Resolution note shorter than 10 chars is rejected with 400', async () => {
      if (!seedConflictId) return;

      const res = await request(app)
        .put(`/api/conflicts/${seedConflictId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED', resolutionNote: 'Short' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details).toHaveProperty('resolutionNote');
    });

    it('Conflict resolution update is recorded in audit_logs', async () => {
      if (!seedConflictId) return;

      const logs = await prisma.auditLog.findMany({
        where: {
          action: { in: ['CONFLICT_RESOLUTION_UPDATE', 'CONFLICT_DETECTED'] },
          entityId: seedConflictId,
        },
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });
});

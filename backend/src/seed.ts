import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from './db/prisma';
import { Role } from './types/role';
import { ClaimStatus } from '@prisma/client';
import { EVIDENCE_UPLOAD_DIR } from './services/evidenceService';

async function seed() {
  console.log('🌱 Seeding synthetic users, claims, status history, and evidence for VanSetu...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Users
  const usersData = [
    {
      name: 'Ramesh Majhi (Citizen)',
      email: 'citizen@vansetu.in',
      passwordHash,
      role: Role.CITIZEN,
      districtId: 'DIST_OD_KANDHAMAL',
      stateId: 'STATE_ODISHA',
    },
    {
      name: 'Priya Sharma (Field Officer)',
      email: 'officer@vansetu.in',
      passwordHash,
      role: Role.FIELD_OFFICER,
      districtId: 'DIST_OD_KANDHAMAL',
      stateId: 'STATE_ODISHA',
    },
    {
      name: 'Sunil Patnaik (District Collector)',
      email: 'admin.district@vansetu.in',
      passwordHash,
      role: Role.DISTRICT_ADMIN,
      districtId: 'DIST_OD_KANDHAMAL',
      stateId: 'STATE_ODISHA',
    },
    {
      name: 'Anita Roy (State Nodal Officer)',
      email: 'admin.state@vansetu.in',
      passwordHash,
      role: Role.STATE_ADMIN,
      districtId: null,
      stateId: 'STATE_ODISHA',
    },
  ];

  const userMap: Record<string, string> = {};

  for (const u of usersData) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    userMap[u.role] = created.id;
    console.log(`  - Seeded user: ${u.name} (${u.role})`);
  }

  // Seed SYSTEM actor user row to back automated system operations & audit logs
  await prisma.user.upsert({
    where: { id: 'SYSTEM' },
    update: {},
    create: {
      id: 'SYSTEM',
      name: 'VanSetu Automated Engine',
      email: 'system@vansetu.in',
      passwordHash,
      role: Role.STATE_ADMIN,
    },
  });
  console.log('  - Seeded system user: SYSTEM');

  const defaultClaimantId = userMap[Role.CITIZEN];
  const officerClaimantId = userMap[Role.FIELD_OFFICER];
  const officerUserId = userMap[Role.FIELD_OFFICER];
  const adminUserId = userMap[Role.DISTRICT_ADMIN];

  // 2. 18 Synthetic Claims Data
  const claimsData = [
    {
      claimNumber: 'OD-KAN-IFR-001',
      claimType: 'IFR',
      claimantId: defaultClaimantId,
      districtId: 'DIST_OD_KANDHAMAL',
      tehsilId: 'TEH_BALLIGUDA',
      villageId: 'VIL_DARINGBADI',
      status: 'APPROVED',
      areaHectares: 2.4,
      riskScore: 14.0,
      riskLevel: 'LOW',
      geometry: [[ [83.89, 20.08], [83.92, 20.07], [83.94, 20.11], [83.91, 20.12], [83.89, 20.08] ]],
    },
    {
      claimNumber: 'OD-KAN-IFR-002',
      claimType: 'IFR',
      claimantId: defaultClaimantId,
      districtId: 'DIST_OD_KANDHAMAL',
      tehsilId: 'TEH_BALLIGUDA',
      villageId: 'VIL_DARINGBADI',
      status: 'FIELD_VERIFICATION',
      areaHectares: 3.8,
      riskScore: 48.0,
      riskLevel: 'MEDIUM',
      geometry: [[ [83.93, 20.13], [83.96, 20.12], [83.98, 20.16], [83.94, 20.17], [83.93, 20.13] ]],
    },
    {
      claimNumber: 'OD-KAN-CR-003',
      claimType: 'CR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_KANDHAMAL',
      tehsilId: 'TEH_BALLIGUDA',
      villageId: 'VIL_DARINGBADI',
      status: 'CONFLICT_REVIEW',
      areaHectares: 14.5,
      riskScore: 87.0,
      riskLevel: 'HIGH',
      geometry: [[ [83.87, 20.14], [83.93, 20.14], [83.93, 20.19], [83.87, 20.19], [83.87, 20.14] ]],
    },
    {
      claimNumber: 'OD-KAN-CR-004',
      claimType: 'CR',
      claimantId: defaultClaimantId,
      districtId: 'DIST_OD_KANDHAMAL',
      tehsilId: 'TEH_BALLIGUDA',
      villageId: 'VIL_DARINGBADI',
      status: 'SUBMITTED',
      areaHectares: 12.1,
      riskScore: 75.0,
      riskLevel: 'HIGH',
      geometry: [[ [83.90, 20.16], [83.96, 20.16], [83.96, 20.21], [83.90, 20.21], [83.90, 20.16] ]],
    },
    {
      claimNumber: 'OD-KAN-CFR-005',
      claimType: 'CFR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_KANDHAMAL',
      tehsilId: 'TEH_BALLIGUDA',
      villageId: 'VIL_DARINGBADI',
      status: 'APPROVED',
      areaHectares: 45.0,
      riskScore: 22.0,
      riskLevel: 'LOW',
      geometry: [[ [83.85, 20.04], [83.95, 20.03], [83.96, 20.10], [83.86, 20.11], [83.85, 20.04] ]],
    },
    {
      claimNumber: 'OD-KAN-IFR-006',
      claimType: 'IFR',
      claimantId: defaultClaimantId,
      districtId: 'DIST_OD_KANDHAMAL',
      tehsilId: 'TEH_PHULBANI',
      villageId: 'VIL_CHAKAPADA',
      status: 'GRAM_SABHA_REVIEW',
      areaHectares: 1.8,
      riskScore: 35.0,
      riskLevel: 'LOW',
      geometry: [[ [84.10, 20.30], [84.13, 20.29], [84.15, 20.33], [84.11, 20.34], [84.10, 20.30] ]],
    },
    {
      claimNumber: 'OD-KAN-IFR-007',
      claimType: 'IFR',
      claimantId: defaultClaimantId,
      districtId: 'DIST_OD_KANDHAMAL',
      tehsilId: 'TEH_PHULBANI',
      villageId: 'VIL_CHAKAPADA',
      status: 'REJECTED',
      areaHectares: 4.2,
      riskScore: 92.0,
      riskLevel: 'CRITICAL',
      geometry: [[ [84.15, 20.35], [84.19, 20.34], [84.21, 20.38], [84.17, 20.39], [84.15, 20.35] ]],
    },
    {
      claimNumber: 'OD-KAN-CR-008',
      claimType: 'CR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_KANDHAMAL',
      tehsilId: 'TEH_PHULBANI',
      villageId: 'VIL_CHAKAPADA',
      status: 'FIELD_VERIFICATION',
      areaHectares: 8.6,
      riskScore: 55.0,
      riskLevel: 'MEDIUM',
      geometry: [[ [84.18, 20.39], [84.23, 20.38], [84.25, 20.43], [84.20, 20.44], [84.18, 20.39] ]],
    },
    {
      claimNumber: 'OD-MAY-IFR-009',
      claimType: 'IFR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_MAYURBHANJ',
      tehsilId: 'TEH_BARIPADA',
      villageId: 'VIL_SIMILIPAL',
      status: 'APPROVED',
      areaHectares: 2.1,
      riskScore: 18.0,
      riskLevel: 'LOW',
      geometry: [[ [86.40, 21.84], [86.43, 21.83], [86.45, 21.87], [86.41, 21.88], [86.40, 21.84] ]],
    },
    {
      claimNumber: 'OD-MAY-IFR-010',
      claimType: 'IFR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_MAYURBHANJ',
      tehsilId: 'TEH_BARIPADA',
      villageId: 'VIL_SIMILIPAL',
      status: 'SUBMITTED',
      areaHectares: 1.5,
      riskScore: 42.0,
      riskLevel: 'MEDIUM',
      geometry: [[ [86.46, 21.89], [86.49, 21.88], [86.51, 21.92], [86.47, 21.93], [86.46, 21.89] ]],
    },
    {
      claimNumber: 'OD-MAY-CFR-011',
      claimType: 'CFR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_MAYURBHANJ',
      tehsilId: 'TEH_BARIPADA',
      villageId: 'VIL_SIMILIPAL',
      status: 'SUBDIVISION_REVIEW',
      areaHectares: 62.0,
      riskScore: 68.0,
      riskLevel: 'HIGH',
      geometry: [[ [86.38, 21.93], [86.48, 21.92], [86.50, 22.00], [86.40, 22.01], [86.38, 21.93] ]],
    },
    {
      claimNumber: 'OD-MAY-CR-012',
      claimType: 'CR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_MAYURBHANJ',
      tehsilId: 'TEH_BARIPADA',
      villageId: 'VIL_SIMILIPAL',
      status: 'CONFLICT_REVIEW',
      areaHectares: 18.4,
      riskScore: 89.0,
      riskLevel: 'CRITICAL',
      geometry: [[ [86.42, 21.80], [86.48, 21.80], [86.48, 21.86], [86.42, 21.86], [86.42, 21.80] ]],
    },
    {
      claimNumber: 'OD-MAY-CR-013',
      claimType: 'CR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_MAYURBHANJ',
      tehsilId: 'TEH_BARIPADA',
      villageId: 'VIL_SIMILIPAL',
      status: 'FIELD_VERIFICATION',
      areaHectares: 16.2,
      riskScore: 81.0,
      riskLevel: 'HIGH',
      geometry: [[ [86.45, 21.83], [86.51, 21.83], [86.51, 21.89], [86.45, 21.89], [86.45, 21.83] ]],
    },
    {
      claimNumber: 'OD-MAY-IFR-014',
      claimType: 'IFR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_MAYURBHANJ',
      tehsilId: 'TEH_RAIRANGPUR',
      villageId: 'VIL_KIRIBURU',
      status: 'APPROVED',
      areaHectares: 3.1,
      riskScore: 10.0,
      riskLevel: 'LOW',
      geometry: [[ [86.08, 22.02], [86.11, 22.01], [86.13, 22.05], [86.09, 22.06], [86.08, 22.02] ]],
    },
    {
      claimNumber: 'OD-MAY-IFR-015',
      claimType: 'IFR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_MAYURBHANJ',
      tehsilId: 'TEH_RAIRANGPUR',
      villageId: 'VIL_KIRIBURU',
      status: 'NEEDS_CORRECTION',
      areaHectares: 2.9,
      riskScore: 64.0,
      riskLevel: 'HIGH',
      geometry: [[ [86.14, 22.07], [86.17, 22.06], [86.19, 22.10], [86.15, 22.11], [86.14, 22.07] ]],
    },
    {
      claimNumber: 'OD-MAY-CR-016',
      claimType: 'CR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_MAYURBHANJ',
      tehsilId: 'TEH_RAIRANGPUR',
      villageId: 'VIL_KIRIBURU',
      status: 'SUBMITTED',
      areaHectares: 9.4,
      riskScore: 30.0,
      riskLevel: 'LOW',
      geometry: [[ [86.18, 22.12], [86.23, 22.11], [86.25, 22.16], [86.20, 22.17], [86.18, 22.12] ]],
    },
    {
      claimNumber: 'OD-MAY-CFR-017',
      claimType: 'CFR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_MAYURBHANJ',
      tehsilId: 'TEH_RAIRANGPUR',
      villageId: 'VIL_KIRIBURU',
      status: 'APPROVED',
      areaHectares: 38.0,
      riskScore: 15.0,
      riskLevel: 'LOW',
      geometry: [[ [86.06, 22.10], [86.16, 22.09], [86.18, 22.17], [86.08, 22.18], [86.06, 22.10] ]],
    },
    {
      claimNumber: 'OD-MAY-IFR-018',
      claimType: 'IFR',
      claimantId: officerClaimantId,
      districtId: 'DIST_OD_MAYURBHANJ',
      tehsilId: 'TEH_RAIRANGPUR',
      villageId: 'VIL_KIRIBURU',
      status: 'DISTRICT_REVIEW',
      areaHectares: 2.7,
      riskScore: 50.0,
      riskLevel: 'MEDIUM',
      geometry: [[ [86.20, 22.17], [86.24, 22.16], [86.26, 22.20], [86.22, 22.21], [86.20, 22.17] ]],
    },
  ];

  console.log('📌 Seeding 18 synthetic claim polygons...');
  for (const c of claimsData) {
    const geometryJson = JSON.stringify({
      type: 'Polygon',
      coordinates: c.geometry,
    });

    const claim = await prisma.claim.upsert({
      where: { claimNumber: c.claimNumber },
      update: {
        status: c.status as any,
        areaHectares: c.areaHectares,
        riskScore: c.riskScore,
        riskLevel: c.riskLevel,
        geometryJson,
      },
      create: {
        claimNumber: c.claimNumber,
        claimType: c.claimType as any,
        claimantId: c.claimantId,
        districtId: c.districtId,
        tehsilId: c.tehsilId,
        villageId: c.villageId,
        status: c.status as any,
        areaHectares: c.areaHectares,
        riskScore: c.riskScore,
        riskLevel: c.riskLevel,
        geometryJson,
      },
    });

    // Seed StatusHistory timeline records
    await prisma.statusHistory.deleteMany({ where: { claimId: claim.id } });
    await prisma.statusHistory.createMany({
      data: [
        {
          claimId: claim.id,
          fromStatus: ClaimStatus.DRAFT,
          toStatus: ClaimStatus.DRAFT,
          changedBy: c.claimantId,
          remarks: 'Initial claim draft registered',
          createdAt: new Date(Date.now() - 86400000 * 10),
        },
        {
          claimId: claim.id,
          fromStatus: ClaimStatus.DRAFT,
          toStatus: ClaimStatus.SUBMITTED,
          changedBy: c.claimantId,
          remarks: 'Claim submitted with attached boundary evidence',
          createdAt: new Date(Date.now() - 86400000 * 7),
        },
        ...(c.status !== 'SUBMITTED' && c.status !== 'DRAFT'
          ? [
              {
                claimId: claim.id,
                fromStatus: ClaimStatus.SUBMITTED,
                toStatus: c.status as ClaimStatus,
                changedBy: officerUserId,
                remarks: `Status updated to ${c.status} during verification pass`,
                createdAt: new Date(Date.now() - 86400000 * 2),
              },
            ]
          : []),
      ],
    });

    // Ensure sample evidence PDF/JPEG file binary exists on disk
    if (!fs.existsSync(EVIDENCE_UPLOAD_DIR)) {
      fs.mkdirSync(EVIDENCE_UPLOAD_DIR, { recursive: true });
    }

    const dummyPdfContent = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n168\n%%EOF'
    );
    const sampleFileName = `sample_${c.claimNumber.toLowerCase()}.pdf`;
    const sampleFilePath = path.join(EVIDENCE_UPLOAD_DIR, sampleFileName);
    fs.writeFileSync(sampleFilePath, dummyPdfContent);

    const fileHash = crypto.createHash('sha256').update(dummyPdfContent).digest('hex');

    await prisma.evidence.deleteMany({ where: { claimId: claim.id } });
    await prisma.evidence.create({
      data: {
        claimId: claim.id,
        type: 'Gram Sabha Resolution & Boundary Map',
        fileUrl: sampleFileName,
        latitude: 20.081,
        longitude: 83.912,
        capturedBy: 'Priya Sharma (Field Officer)',
        fileHash,
        mimeTypeVerified: true,
      },
    });

    console.log(`  - Seeded claim: ${c.claimNumber} (${c.status}, Area: ${c.areaHectares} Ha) + Status History & Evidence`);
  }

  console.log('✅ Seeding completed successfully with Phase 3 extensions!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { ClaimStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { Role } from '../types/role';
import { computeAndPersistRiskScore } from './riskService';

interface TransitionRule {
  target: ClaimStatus;
  roles: Role[];
}

export const WORKFLOW_RULES: Record<ClaimStatus, TransitionRule[]> = {
  [ClaimStatus.DRAFT]: [
    { target: ClaimStatus.SUBMITTED, roles: [Role.CITIZEN, Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
  ],
  [ClaimStatus.SUBMITTED]: [
    { target: ClaimStatus.FIELD_VERIFICATION, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.NEEDS_CORRECTION, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.REJECTED, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
  ],
  [ClaimStatus.FIELD_VERIFICATION]: [
    { target: ClaimStatus.GRAM_SABHA_REVIEW, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.CONFLICT_REVIEW, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.NEEDS_CORRECTION, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.REJECTED, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
  ],
  [ClaimStatus.GRAM_SABHA_REVIEW]: [
    { target: ClaimStatus.SUBDIVISION_REVIEW, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.NEEDS_CORRECTION, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.REJECTED, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
  ],
  [ClaimStatus.SUBDIVISION_REVIEW]: [
    { target: ClaimStatus.DISTRICT_REVIEW, roles: [Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.NEEDS_CORRECTION, roles: [Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.REJECTED, roles: [Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
  ],
  [ClaimStatus.DISTRICT_REVIEW]: [
    { target: ClaimStatus.APPROVED, roles: [Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.REJECTED, roles: [Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.NEEDS_CORRECTION, roles: [Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
  ],
  [ClaimStatus.NEEDS_CORRECTION]: [
    { target: ClaimStatus.DRAFT, roles: [Role.CITIZEN, Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.SUBMITTED, roles: [Role.CITIZEN, Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
  ],
  [ClaimStatus.CONFLICT_REVIEW]: [
    { target: ClaimStatus.FIELD_VERIFICATION, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.GRAM_SABHA_REVIEW, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
    { target: ClaimStatus.REJECTED, roles: [Role.FIELD_OFFICER, Role.DISTRICT_ADMIN, Role.STATE_ADMIN] },
  ],
  [ClaimStatus.APPROVED]: [],
  [ClaimStatus.REJECTED]: [],
};

export function validateStatusTransition(
  currentStatus: ClaimStatus,
  targetStatus: ClaimStatus,
  userRole: Role
): { valid: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { valid: false, reason: `Claim is already in status ${currentStatus}` };
  }

  const possibleTransitions = WORKFLOW_RULES[currentStatus] || [];
  const matchedRule = possibleTransitions.find((r) => r.target === targetStatus);

  if (!matchedRule) {
    return {
      valid: false,
      reason: `Invalid status transition from ${currentStatus} to ${targetStatus}`,
    };
  }

  if (!matchedRule.roles.includes(userRole)) {
    return {
      valid: false,
      reason: `Role ${userRole} is not authorized to transition status from ${currentStatus} to ${targetStatus}`,
    };
  }

  return { valid: true };
}

export async function transitionClaimStatus(
  claimId: string,
  targetStatus: ClaimStatus,
  userId: string,
  userRole: Role,
  remarks?: string
) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
  });

  if (!claim) {
    throw new Error('Claim not found');
  }

  const validation = validateStatusTransition(claim.status, targetStatus, userRole);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  return await prisma.$transaction(async (tx) => {
    const updatedClaim = await tx.claim.update({
      where: { id: claimId },
      data: {
        status: targetStatus,
        submittedAt: targetStatus === ClaimStatus.SUBMITTED && !claim.submittedAt ? new Date() : claim.submittedAt,
        version: { increment: 1 },
      },
    });

    const statusHistory = await tx.statusHistory.create({
      data: {
        claimId,
        fromStatus: claim.status,
        toStatus: targetStatus,
        changedBy: userId,
        remarks: remarks || null,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'STATUS_TRANSITION',
        entityType: 'Claim',
        entityId: claimId,
        oldValue: JSON.stringify({ status: claim.status }),
        newValue: JSON.stringify({ status: targetStatus, remarks }),
      },
    });

    return { claim: updatedClaim, statusHistory };
  }).then(async (result) => {
    // Phase 5: Recalculate risk score after status transition (event-driven trigger)
    await computeAndPersistRiskScore(claimId);
    return result;
  });
}

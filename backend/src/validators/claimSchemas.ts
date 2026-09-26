import { z } from 'zod';
import { ClaimType, ClaimStatus } from '@prisma/client';

export const createClaimSchema = z.object({
  claimType: z.nativeEnum(ClaimType, { errorMap: () => ({ message: 'Invalid claim type. Must be IFR, CR, or CFR.' }) }),
  districtId: z.string().min(1, 'District ID is required'),
  tehsilId: z.string().min(1, 'Tehsil ID is required'),
  villageId: z.string().min(1, 'Village ID is required'),
  areaHectares: z.number().positive('Area in hectares must be a positive number'),
  geometry: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))).min(1, 'Polygon coordinates must have at least 1 ring'),
  }, { errorMap: () => ({ message: 'Invalid GeoJSON Polygon structure' }) }).optional(),
  geometryJson: z.string().optional(),
});

export const updateClaimSchema = createClaimSchema.partial();

export const statusTransitionSchema = z.object({
  targetStatus: z.nativeEnum(ClaimStatus, { errorMap: () => ({ message: 'Invalid claim status target' }) }),
  remarks: z.string().optional(),
});

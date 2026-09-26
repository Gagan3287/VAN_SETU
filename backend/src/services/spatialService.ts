/**
 * spatialService.ts
 *
 * Formats Prisma Claim records into GeoJSON FeatureCollections
 * for the WebGIS Atlas map layer.
 *
 * IMPORTANT (Blueprint §17): The bulk spatial endpoint returns PII-FREE
 * properties only. Claimant name/phone/email are NEVER included here.
 * Full claimant details are returned exclusively by GET /api/claims/:id.
 */

interface ClaimRecord {
  id: string;
  claimNumber: string;
  claimType: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  areaHectares: number;
  districtId: string;
  tehsilId: string;
  villageId: string;
  geometryJson: string | null;
}

/**
 * Convert a single claim DB record to a GeoJSON Feature.
 * Properties are PII-free: no claimant name, phone, or email.
 */
export const claimToGeoJsonFeature = (claim: ClaimRecord): GeoJSON.Feature | null => {
  if (!claim.geometryJson) return null;

  let geometry: GeoJSON.Geometry;
  try {
    geometry = JSON.parse(claim.geometryJson);
  } catch {
    console.warn(`Invalid geometry JSON for claim ${claim.claimNumber}, skipping.`);
    return null;
  }

  return {
    type: 'Feature',
    properties: {
      id: claim.id,
      claimNumber: claim.claimNumber,
      claimType: claim.claimType,
      status: claim.status,
      riskScore: claim.riskScore,
      riskLevel: claim.riskLevel,
      areaHectares: claim.areaHectares,
      districtId: claim.districtId,
      tehsilId: claim.tehsilId,
      villageId: claim.villageId,
      // NOTE: No claimant PII here. See Blueprint §17.
    },
    geometry,
  };
};

/**
 * Convert an array of claim DB records to a GeoJSON FeatureCollection.
 */
export const claimsToFeatureCollection = (claims: ClaimRecord[]): GeoJSON.FeatureCollection => {
  const features = claims
    .map(claimToGeoJsonFeature)
    .filter((f): f is GeoJSON.Feature => f !== null);

  return {
    type: 'FeatureCollection',
    features,
  };
};

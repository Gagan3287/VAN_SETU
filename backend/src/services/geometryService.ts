/**
 * geometryService.ts
 *
 * Pure utility for server-side polygon geometry validation.
 * No DB calls — called from claimController before any persistence.
 *
 * Validates:
 *  1. Coordinate finiteness (no NaN, no Infinity)
 *  2. WGS-84 coordinate bounds
 *  3. Minimum ring closure (first === last coord pair)
 *  4. Minimum 4 coordinate pairs per ring
 *  5. Self-intersection detection (Shamos-Hoey sweep-line)
 */

export interface GeometryValidationResult {
  valid: boolean;
  reason?: string;
}

/** GeoJSON Polygon type used internally */
interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

// ---------------------------------------------------------------------------
// Helper: segment intersection test (Shamos-Hoey)
// ---------------------------------------------------------------------------

type Point = [number, number];
type Segment = [Point, Point];

function cross(o: Point, a: Point, b: Point): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function onSegment(p: Point, q: Point, r: Point): boolean {
  return (
    Math.min(p[0], r[0]) <= q[0] &&
    q[0] <= Math.max(p[0], r[0]) &&
    Math.min(p[1], r[1]) <= q[1] &&
    q[1] <= Math.max(p[1], r[1])
  );
}

function segmentsIntersect(s1: Segment, s2: Segment): boolean {
  const [p1, q1] = s1;
  const [p2, q2] = s2;

  const d1 = cross(p2, q2, p1);
  const d2 = cross(p2, q2, q1);
  const d3 = cross(p1, q1, p2);
  const d4 = cross(p1, q1, q2);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (d1 === 0 && onSegment(p2, p1, q2)) return true;
  if (d2 === 0 && onSegment(p2, q1, q2)) return true;
  if (d3 === 0 && onSegment(p1, p2, q1)) return true;
  if (d4 === 0 && onSegment(p1, q2, q1)) return true;

  return false;
}

/**
 * Check whether a ring (array of [lng, lat] pairs) self-intersects.
 * Adjacent segments share an endpoint — those are allowed and skipped.
 */
function ringIsSelfIntersecting(ring: number[][]): boolean {
  const n = ring.length - 1; // last coord == first for closed rings
  const segments: Segment[] = [];
  for (let i = 0; i < n; i++) {
    segments.push([
      [ring[i][0], ring[i][1]],
      [ring[i + 1][0], ring[i + 1][1]],
    ]);
  }

  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 2; j < segments.length; j++) {
      // Skip the pair (last, first) which shares the closure vertex
      if (i === 0 && j === segments.length - 1) continue;
      if (segmentsIntersect(segments[i], segments[j])) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Public validation API
// ---------------------------------------------------------------------------

/**
 * Validate a GeoJSON Polygon object before writing to DB / PostGIS.
 * Returns { valid: true } on success, { valid: false, reason } on failure.
 */
export function validatePolygonGeometry(geometry: GeoJsonPolygon): GeometryValidationResult {
  if (!geometry || geometry.type !== 'Polygon') {
    return { valid: false, reason: 'Geometry must be a GeoJSON Polygon' };
  }

  const { coordinates } = geometry;
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return { valid: false, reason: 'Polygon must have at least one ring' };
  }

  for (let ri = 0; ri < coordinates.length; ri++) {
    const ring = coordinates[ri];
    const ringLabel = ri === 0 ? 'exterior ring' : `interior ring ${ri}`;

    // 1. Minimum vertex count (closed ring needs ≥4 pairs: 3 unique + closure)
    if (!Array.isArray(ring) || ring.length < 4) {
      return {
        valid: false,
        reason: `Polygon ${ringLabel} must have at least 4 coordinate pairs (got ${ring?.length ?? 0})`,
      };
    }

    for (let ci = 0; ci < ring.length; ci++) {
      const coord = ring[ci];

      // 2. Coordinate pair structure
      if (!Array.isArray(coord) || coord.length < 2) {
        return { valid: false, reason: `Invalid coordinate at ${ringLabel}[${ci}]` };
      }

      const [lng, lat] = coord;

      // 3. Finite numbers
      if (!isFinite(lng) || !isFinite(lat)) {
        return { valid: false, reason: `Non-finite coordinate value at ${ringLabel}[${ci}]: [${lng}, ${lat}]` };
      }

      // 4. WGS-84 bounds
      if (lng < -180 || lng > 180) {
        return { valid: false, reason: `Longitude out of bounds at ${ringLabel}[${ci}]: ${lng} (must be -180 to 180)` };
      }
      if (lat < -90 || lat > 90) {
        return { valid: false, reason: `Latitude out of bounds at ${ringLabel}[${ci}]: ${lat} (must be -90 to 90)` };
      }
    }

    // 5. Ring closure: first coord must equal last coord
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      return {
        valid: false,
        reason: `Polygon ${ringLabel} is not closed — first and last coordinates must be identical`,
      };
    }

    // 6. Self-intersection check
    if (ringIsSelfIntersecting(ring)) {
      return {
        valid: false,
        reason: `Polygon ${ringLabel} is self-intersecting (bowtie/figure-8 shape). Rings must be simple polygons.`,
      };
    }
  }

  return { valid: true };
}

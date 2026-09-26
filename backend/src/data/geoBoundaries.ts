/**
 * Static GeoJSON boundary definitions for Odisha administrative hierarchy.
 * Used for District, Tehsil, and Village boundary layers on the WebGIS Atlas.
 *
 * These are simplified polygon coordinates for visual rendering.
 * In production, boundaries would be loaded from Bhuvan/data.gov.in shapefiles.
 */

export interface AdminBoundary {
  id: string;
  name: string;
  parentId?: string; // districtId for tehsils, tehsilId for villages
  stateId: string;
  center: [number, number]; // [lat, lng]
  geometry: GeoJSON.Polygon;
}

// ─── DISTRICT BOUNDARIES ───────────────────────────────────────────────────────

export const districtBoundaries: AdminBoundary[] = [
  {
    id: 'DIST_OD_KANDHAMAL',
    name: 'Kandhamal',
    stateId: 'STATE_ODISHA',
    center: [20.245, 84.050],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [83.80, 20.00], [84.00, 19.95], [84.30, 20.05],
        [84.35, 20.25], [84.30, 20.50], [84.10, 20.55],
        [83.85, 20.45], [83.75, 20.20], [83.80, 20.00],
      ]],
    },
  },
  {
    id: 'DIST_OD_MAYURBHANJ',
    name: 'Mayurbhanj',
    stateId: 'STATE_ODISHA',
    center: [21.930, 86.430],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [86.10, 21.65], [86.40, 21.60], [86.75, 21.75],
        [86.80, 22.00], [86.70, 22.25], [86.40, 22.30],
        [86.15, 22.10], [86.05, 21.85], [86.10, 21.65],
      ]],
    },
  },
];

// ─── TEHSIL BOUNDARIES ─────────────────────────────────────────────────────────

export const tehsilBoundaries: AdminBoundary[] = [
  {
    id: 'TEH_BALLIGUDA',
    name: 'Balliguda',
    parentId: 'DIST_OD_KANDHAMAL',
    stateId: 'STATE_ODISHA',
    center: [20.20, 83.90],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [83.80, 20.00], [84.00, 19.95], [84.10, 20.10],
        [84.05, 20.30], [83.90, 20.35], [83.75, 20.20], [83.80, 20.00],
      ]],
    },
  },
  {
    id: 'TEH_PHULBANI',
    name: 'Phulbani',
    parentId: 'DIST_OD_KANDHAMAL',
    stateId: 'STATE_ODISHA',
    center: [20.35, 84.20],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [84.05, 20.20], [84.30, 20.15], [84.35, 20.35],
        [84.20, 20.50], [84.05, 20.45], [84.00, 20.30], [84.05, 20.20],
      ]],
    },
  },
  {
    id: 'TEH_BARIPADA',
    name: 'Baripada',
    parentId: 'DIST_OD_MAYURBHANJ',
    stateId: 'STATE_ODISHA',
    center: [21.95, 86.50],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [86.25, 21.75], [86.55, 21.70], [86.70, 21.85],
        [86.65, 22.10], [86.40, 22.15], [86.25, 21.95], [86.25, 21.75],
      ]],
    },
  },
  {
    id: 'TEH_RAIRANGPUR',
    name: 'Rairangpur',
    parentId: 'DIST_OD_MAYURBHANJ',
    stateId: 'STATE_ODISHA',
    center: [22.10, 86.20],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [86.05, 21.90], [86.25, 21.85], [86.40, 22.00],
        [86.35, 22.25], [86.15, 22.30], [86.00, 22.10], [86.05, 21.90],
      ]],
    },
  },
];

// ─── VILLAGE BOUNDARIES ─────────────────────────────────────────────────────────

export const villageBoundaries: AdminBoundary[] = [
  {
    id: 'VIL_DARINGBADI',
    name: 'Daringbadi',
    parentId: 'TEH_BALLIGUDA',
    stateId: 'STATE_ODISHA',
    center: [20.12, 83.92],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [83.88, 20.05], [83.96, 20.03], [84.00, 20.10],
        [83.97, 20.20], [83.90, 20.22], [83.85, 20.14], [83.88, 20.05],
      ]],
    },
  },
  {
    id: 'VIL_CHAKAPADA',
    name: 'Chakapada',
    parentId: 'TEH_PHULBANI',
    stateId: 'STATE_ODISHA',
    center: [20.35, 84.15],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [84.08, 20.28], [84.18, 20.25], [84.24, 20.33],
        [84.20, 20.42], [84.12, 20.44], [84.06, 20.36], [84.08, 20.28],
      ]],
    },
  },
  {
    id: 'VIL_SIMILIPAL',
    name: 'Similipal',
    parentId: 'TEH_BARIPADA',
    stateId: 'STATE_ODISHA',
    center: [21.90, 86.45],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [86.35, 21.80], [86.50, 21.78], [86.58, 21.88],
        [86.55, 22.00], [86.42, 22.02], [86.33, 21.92], [86.35, 21.80],
      ]],
    },
  },
  {
    id: 'VIL_KIRIBURU',
    name: 'Kiriburu',
    parentId: 'TEH_RAIRANGPUR',
    stateId: 'STATE_ODISHA',
    center: [22.05, 86.15],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [86.05, 21.98], [86.18, 21.95], [86.25, 22.05],
        [86.22, 22.18], [86.10, 22.20], [86.03, 22.10], [86.05, 21.98],
      ]],
    },
  },
];

// ─── HELPER: Lookup tables ──────────────────────────────────────────────────────

export const getDistrictById = (id: string) => districtBoundaries.find((d) => d.id === id);
export const getTehsilsByDistrict = (districtId: string) => tehsilBoundaries.filter((t) => t.parentId === districtId);
export const getVillagesByTehsil = (tehsilId: string) => villageBoundaries.filter((v) => v.parentId === tehsilId);

export const toGeoJsonFeature = (boundary: AdminBoundary): GeoJSON.Feature => ({
  type: 'Feature',
  properties: {
    id: boundary.id,
    name: boundary.name,
    parentId: boundary.parentId || null,
    stateId: boundary.stateId,
    center: boundary.center,
  },
  geometry: boundary.geometry,
});

export const toFeatureCollection = (boundaries: AdminBoundary[]): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: boundaries.map(toGeoJsonFeature),
});

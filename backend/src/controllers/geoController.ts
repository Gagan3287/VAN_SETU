import { Request, Response } from 'express';
import {
  districtBoundaries,
  tehsilBoundaries,
  villageBoundaries,
  toFeatureCollection,
  getTehsilsByDistrict,
  getVillagesByTehsil,
} from '../data/geoBoundaries';

/**
 * GET /api/geo/districts
 * Returns all district boundaries as a GeoJSON FeatureCollection.
 */
export const getDistricts = (req: Request, res: Response) => {
  try {
    const geoJson = toFeatureCollection(districtBoundaries);
    return res.json({
      success: true,
      data: geoJson,
    });
  } catch (error) {
    console.error('getDistricts error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * GET /api/geo/tehsils
 * Returns tehsil boundaries, optionally filtered by ?districtId=
 */
export const getTehsils = (req: Request, res: Response) => {
  try {
    const { districtId } = req.query;
    const boundaries = districtId
      ? getTehsilsByDistrict(districtId as string)
      : tehsilBoundaries;
    const geoJson = toFeatureCollection(boundaries);
    return res.json({
      success: true,
      data: geoJson,
    });
  } catch (error) {
    console.error('getTehsils error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * GET /api/geo/villages
 * Returns village boundaries, optionally filtered by ?tehsilId= or ?districtId=
 */
export const getVillages = (req: Request, res: Response) => {
  try {
    const { tehsilId, districtId } = req.query;
    let boundaries = villageBoundaries;

    if (tehsilId) {
      boundaries = getVillagesByTehsil(tehsilId as string);
    } else if (districtId) {
      const validTehsilIds = getTehsilsByDistrict(districtId as string).map((t) => t.id);
      boundaries = villageBoundaries.filter((v) => v.parentId && validTehsilIds.includes(v.parentId));
    }

    const geoJson = toFeatureCollection(boundaries);
    return res.json({
      success: true,
      data: geoJson,
    });
  } catch (error) {
    console.error('getVillages error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

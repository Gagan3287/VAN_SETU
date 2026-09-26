import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

interface AtlasMapProps {
  districtsGeoJson: GeoJSON.FeatureCollection | null;
  tehsilsGeoJson: GeoJSON.FeatureCollection | null;
  villagesGeoJson: GeoJSON.FeatureCollection | null;
  claimsGeoJson: GeoJSON.FeatureCollection | null;
  showConflictHeatmap?: boolean;
  onSelectClaim: (claimId: string) => void;
}

export const AtlasMap: React.FC<AtlasMapProps> = ({
  districtsGeoJson,
  tehsilsGeoJson,
  villagesGeoJson,
  claimsGeoJson,
  showConflictHeatmap = false,
  onSelectClaim,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    districts?: L.GeoJSON;
    tehsils?: L.GeoJSON;
    villages?: L.GeoJSON;
    claims?: L.GeoJSON;
    clusterGroup?: L.MarkerClusterGroup;
    conflictHeatmap?: L.GeoJSON;
  }>({});

  // Status color mapping for claim polygons
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'APPROVED':
        return '#10B981'; // Emerald Green
      case 'FIELD_VERIFICATION':
      case 'NEEDS_CORRECTION':
        return '#F59E0B'; // Amber Gold
      case 'CONFLICT_REVIEW':
        return '#EF4444'; // Crimson Red
      case 'REJECTED':
        return '#64748B'; // Slate Gray
      case 'SUBMITTED':
      case 'GRAM_SABHA_REVIEW':
      case 'SUBDIVISION_REVIEW':
      case 'DISTRICT_REVIEW':
      default:
        return '#06B6D4'; // Cyan Blue
    }
  };

  // 1. Initialize Map Canvas once — centered on Odisha, India
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Odisha Center coordinates [Latitude: 20.5, Longitude: 84.5], Zoom 7
    const map = L.map(mapContainerRef.current, {
      center: [20.5, 84.5],
      zoom: 7,
      zoomControl: false,
    });

    const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY || '';
    const cartoTileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${cartoApiKey}`;

    // Dark Matter CartoDB Basemap
    const darkCarto = L.tileLayer(cartoTileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // OpenStreetMap Standard Basemap
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Layer Controls
    const baseMaps = {
      'Forest Dark': darkCarto,
      'Street Map': osm,
    };
    L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    // Trigger viewport resize calculation so map fits container without gray tile gaps
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render District Boundary Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.districts) {
      map.removeLayer(layersRef.current.districts);
    }

    if (districtsGeoJson && districtsGeoJson.features.length > 0) {
      const layer = L.geoJSON(districtsGeoJson as any, {
        style: {
          color: '#34A066',
          weight: 2,
          opacity: 0.8,
          fillColor: '#34A066',
          fillOpacity: 0.05,
          dashArray: '4, 4',
        },
      }).addTo(map);
      layersRef.current.districts = layer;

      // Fit map bounds to Odisha district dataset if available
      if (layer.getBounds().isValid()) {
        map.fitBounds(layer.getBounds(), { padding: [30, 30] });
      }
    }
  }, [districtsGeoJson]);

  // 3. Render Tehsil Boundary Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.tehsils) {
      map.removeLayer(layersRef.current.tehsils);
    }

    if (tehsilsGeoJson && tehsilsGeoJson.features.length > 0) {
      const layer = L.geoJSON(tehsilsGeoJson as any, {
        style: {
          color: '#60A5FA',
          weight: 1.5,
          opacity: 0.6,
          fillOpacity: 0,
          dashArray: '2, 3',
        },
      }).addTo(map);
      layersRef.current.tehsils = layer;
    }
  }, [tehsilsGeoJson]);

  // 4. Render Village Boundary Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.villages) {
      map.removeLayer(layersRef.current.villages);
    }

    if (villagesGeoJson && villagesGeoJson.features.length > 0) {
      const layer = L.geoJSON(villagesGeoJson as any, {
        style: {
          color: '#9CA3AF',
          weight: 1,
          opacity: 0.4,
          fillOpacity: 0,
        },
      }).addTo(map);
      layersRef.current.villages = layer;
    }
  }, [villagesGeoJson]);

  // 5. Render GeoJSON Claim Polygons & Marker Clusters
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.claims) {
      map.removeLayer(layersRef.current.claims);
    }
    if (layersRef.current.clusterGroup) {
      map.removeLayer(layersRef.current.clusterGroup);
    }

    if (!claimsGeoJson || claimsGeoJson.features.length === 0) return;

    // Create Leaflet GeoJSON layer for claim polygons
    const claimsLayer = L.geoJSON(claimsGeoJson as any, {
      style: (feature) => {
        const status = feature?.properties?.status || 'SUBMITTED';
        const color = getStatusColor(status);
        return {
          color,
          weight: 2.5,
          opacity: 0.9,
          fillColor: color,
          fillOpacity: 0.45,
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        const statusColor = getStatusColor(props.status);

        // Hover tooltip popup
        layer.bindTooltip(
          `<div class="p-1 text-xs">
            <div class="font-bold text-white font-mono">${props.claimNumber}</div>
            <div class="text-[11px] text-slate-300">Type: <span class="font-bold text-emerald-400">${props.claimType}</span></div>
            <div class="text-[11px] text-slate-300">Status: <span style="color:${statusColor}">${props.status}</span></div>
            <div class="text-[11px] text-slate-300">Area: ${props.areaHectares} Ha | Risk: ${props.riskLevel} (${props.riskScore})</div>
          </div>`,
          { sticky: true, className: 'leaflet-dark-tooltip' }
        );

        // Click handler opening detail drawer
        layer.on({
          mouseover: (e) => {
            const polygon = e.target;
            polygon.setStyle({
              weight: 4,
              fillOpacity: 0.7,
            });
          },
          mouseout: (e) => {
            claimsLayer.resetStyle(e.target);
          },
          click: () => {
            if (props.id) {
              onSelectClaim(props.id);
            }
          },
        });
      },
    }).addTo(map);

    // MarkerCluster group for zoomed-out point representation
    const clusterGroup = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    claimsGeoJson.features.forEach((feature) => {
      if (feature.geometry.type === 'Polygon') {
        const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0];
        // Calculate polygon centroid
        let latSum = 0;
        let lngSum = 0;
        coords.forEach(([lng, lat]) => {
          latSum += lat;
          lngSum += lng;
        });
        const centerLat = latSum / coords.length;
        const centerLng = lngSum / coords.length;

        const marker = L.circleMarker([centerLat, centerLng], {
          radius: 6,
          fillColor: getStatusColor(feature.properties?.status),
          color: '#FFFFFF',
          weight: 1,
          fillOpacity: 0.9,
        });

        marker.on('click', () => {
          if (feature.properties?.id) {
            onSelectClaim(feature.properties.id);
          }
        });

        clusterGroup.addLayer(marker);
      }
    });

    // Auto-fit map bounds to claim polygons if features exist
    if (claimsLayer.getBounds().isValid()) {
      map.fitBounds(claimsLayer.getBounds(), { padding: [40, 40] });
    }

    layersRef.current.claims = claimsLayer;
    layersRef.current.clusterGroup = clusterGroup;
  }, [claimsGeoJson, onSelectClaim]);

  // Conflict Heatmap Overlay — read-only layer derived from claimsGeoJson
  // Highlights CONFLICT_REVIEW claims with a pulsing dashed ring overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.conflictHeatmap) {
      map.removeLayer(layersRef.current.conflictHeatmap);
      layersRef.current.conflictHeatmap = undefined;
    }

    if (!showConflictHeatmap || !claimsGeoJson) return;

    const conflictFeatures = claimsGeoJson.features.filter(
      (f) => f.properties?.status === 'CONFLICT_REVIEW'
    );

    if (conflictFeatures.length === 0) return;

    const heatmapCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: conflictFeatures,
    };

    const heatmapLayer = L.geoJSON(heatmapCollection as any, {
      style: {
        color: '#EF4444',
        weight: 3,
        opacity: 0.9,
        fillColor: '#EF4444',
        fillOpacity: 0.18,
        dashArray: '6, 4',
      },
    }).addTo(map);

    layersRef.current.conflictHeatmap = heatmapLayer;
  }, [claimsGeoJson, showConflictHeatmap]);

  return (
    <div className="relative w-full h-full min-h-[550px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full min-h-[550px] bg-darkbg z-0" />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 glass-panel rounded-lg p-2.5 text-[11px] border border-slate-800 space-y-1.5 shadow-xl">
        <div className="font-bold text-slate-200 text-[10px] uppercase tracking-wider mb-1">Claim Status Legend</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300">Submitted/Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">Field Verification</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-slate-300">Conflict Review</span>
          </div>
        </div>
        {showConflictHeatmap && (
          <div className="pt-1.5 border-t border-slate-700/50 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/40"></span>
              <span className="text-red-300 text-[10px] font-semibold">Conflict Heatmap ON</span>
            </div>
            <div className="text-slate-500 text-[9px] mt-0.5">Prototype thresholds — not FRA rules</div>
          </div>
        )}
      </div>
    </div>
  );
};

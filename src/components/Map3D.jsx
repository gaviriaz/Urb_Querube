import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useMemo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import * as THREE from 'three';
import 'maplibre-gl/dist/maplibre-gl.css';

import { catmullRom, lerpAngle, smoothstep, lerp } from '../utils/splineMath.js';
import { flightWaypoints, getFlightTiming } from '../config/flightWaypoints.js';
import { createProceduralNeighborhood } from '../utils/proceduralModels.js';
import { calculateRouteToLot, routeToGeoJSON, routeDistance as getRouteDistance, interpolateRoute, VEHICLE_TYPES, CAMERA_MODES, getCameraForPerspective } from '../utils/routeAnimation.js';
import { haversineDistanceMeters, extractLotInfo, normalizeLoteoFeatures } from '../utils/lotUtils.js';

// ─────────────────────────────────────────────
// Robust centroid calculator for Polygon / MultiPolygon
// ─────────────────────────────────────────────
const getCentroid = (coords, geometryType) => {
  if (!coords || !Array.isArray(coords)) return null;

  let points = [];

  try {
    if (geometryType === 'MultiPolygon') {
      // MultiPolygon: [polygon][ring][point][coord]
      coords.forEach(polygon => {
        if (Array.isArray(polygon) && polygon.length > 0) {
          const outerRing = polygon[0]; // First ring is the exterior
          if (Array.isArray(outerRing)) {
            outerRing.forEach(pt => {
              if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
                points.push(pt);
              }
            });
          }
        }
      });
    } else if (geometryType === 'Polygon') {
      // Polygon: [ring][point][coord]
      const outerRing = coords[0];
      if (Array.isArray(outerRing)) {
        outerRing.forEach(pt => {
          if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
            points.push(pt);
          }
        });
      }
    } else {
      // Fallback: try to recursively find number pairs
      const flatten = (arr) => {
        if (!Array.isArray(arr)) return;
        if (arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
          points.push(arr);
          return;
        }
        arr.forEach(child => flatten(child));
      };
      flatten(coords);
    }
  } catch (e) {
    console.warn('getCentroid: failed to parse coordinates', e);
    return null;
  }

  if (points.length === 0) return null;

  let lon = 0, lat = 0;
  points.forEach(pt => {
    lon += pt[0];
    lat += pt[1];
  });

  const result = [lon / points.length, lat / points.length];

  // Final NaN guard
  if (isNaN(result[0]) || isNaN(result[1])) return null;

  return result;
};

// ─────────────────────────────────────────────
// Flight HUD Overlay Component
// ─────────────────────────────────────────────
const FlightHUD = ({ progress, totalStations, currentLabel, elapsed, totalDuration, onStop }) => {
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const totalMin = Math.floor(totalDuration / 60000);
  const totalSec = Math.floor((totalDuration % 60000) / 1000);
  const progressPercent = Math.min(100, (elapsed / totalDuration) * 100);

  return (
    <div className="flight-hud" style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.6) 70%, transparent 100%)',
      padding: '30px 24px 16px 24px',
      pointerEvents: 'auto',
      borderTop: '1px solid var(--glass-border)'
    }}>
      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '3px',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: '2px',
        marginBottom: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--gold-600), var(--gold-400))',
          borderRadius: '2px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Station dots */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
          {Array.from({ length: totalStations }, (_, i) => (
            <div
              key={i}
              style={{
                width: i === Math.floor(progress) ? '8px' : '5px',
                height: i === Math.floor(progress) ? '8px' : '5px',
                borderRadius: '50%',
                backgroundColor: i < Math.floor(progress)
                  ? 'var(--gold-500)'
                  : i === Math.floor(progress)
                    ? 'var(--gold-300)'
                    : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s ease',
                boxShadow: i === Math.floor(progress) ? '0 0 6px var(--gold-glow)' : 'none'
              }}
            />
          ))}
        </div>

        {/* Station label */}
        <div style={{
          flex: 1,
          textAlign: 'center',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--gold-300)',
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {currentLabel || 'Recorrido Catastral Virtual'}
        </div>

        {/* Timer */}
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-400)',
          fontFamily: 'monospace',
          flexShrink: 0,
          minWidth: '80px',
          textAlign: 'right'
        }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} / {String(totalMin).padStart(2, '0')}:{String(totalSec).padStart(2, '0')}
        </div>

        {/* Stop button */}
        <button
          onClick={onStop}
          style={{
            padding: '4px 12px',
            borderRadius: '4px',
            border: '1px solid rgba(239,68,68,0.35)',
            backgroundColor: 'rgba(239,68,68,0.1)',
            color: '#ef4444',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={e => { e.target.style.backgroundColor = 'rgba(239,68,68,0.2)'; }}
          onMouseLeave={e => { e.target.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
        >
          Detener
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Route Animation HUD Component
// ─────────────────────────────────────────────
const RouteHUD = ({ vehicleType, cameraMode, progress, distance, onStop, onCycleCamera, onCycleVehicle }) => {
  const vConfig = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES.car;
  const camConfig = CAMERA_MODES[cameraMode] || CAMERA_MODES.third;
  const distTraveled = (distance * progress).toFixed(0);
  const progressPct = Math.min(100, progress * 100);

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
      background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.7) 60%, transparent 100%)',
      padding: '24px 24px 14px 24px', pointerEvents: 'auto',
      borderTop: '1px solid var(--glass-border)'
    }}>
      {/* Progress bar */}
      <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' }}>
        <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold-600), var(--gold-400))', borderRadius: '2px', transition: 'width 0.15s linear' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        {/* Vehicle selector */}
        <button onClick={onCycleVehicle} style={{
          padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(2,132,199,0.3)',
          backgroundColor: 'rgba(2,132,199,0.08)', color: 'var(--gold-300)', fontSize: '0.78rem',
          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          Recorrido: {vConfig.label}
        </button>
        {/* Camera mode */}
        <button onClick={onCycleCamera} style={{
          padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(2,132,199,0.3)',
          backgroundColor: 'rgba(2,132,199,0.08)', color: 'var(--gold-300)', fontSize: '0.78rem',
          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          Vista: {camConfig.label}
        </button>
        {/* Distance */}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-400)', fontFamily: 'monospace' }}>
          {distTraveled} / {distance.toFixed(0)} m
        </span>
        {/* Stop */}
        <button onClick={onStop} style={{
          padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.35)',
          backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.78rem',
          fontWeight: 600, cursor: 'pointer'
        }}>Detener</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Map3D Component
// ─────────────────────────────────────────────
const Map3D = forwardRef(({ onSelectLot, selectedLotId, adminOverrides, viasGeojson, loteoGeojson, manzanaGeojson, predioGeojson, cotasGeojson, voiceEnabled, timeOfDay, environmentalLayer, cameraMode, setCameraMode, viewMode }, ref) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoveredLot, setHoveredLot] = useState(null);
  const [flightActive, setFlightActive] = useState(false);
  
  // Flight HUD state
  const [flightProgress, setFlightProgress] = useState(0);
  const [flightLabel, setFlightLabel] = useState('');
  const [flightElapsed, setFlightElapsed] = useState(0);
  
  // Route animation state
  const [routeActive, setRouteActive] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);
  const [routeDistance, setRouteDistance] = useState(0);
  const [vehicleType, setVehicleType] = useState('car');
  const routeActiveRef = useRef(false);
  const routeReqRef = useRef(null);
  const routeStartTimeRef = useRef(null);
  const routeDataRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const routeCameraRef = useRef(null);
  
  // Drone tour animation references
  const requestRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastSpokenStationRef = useRef(-1);
  const lastHighlightedLotIdRef = useRef(null);
  const flightActiveRef = useRef(false);
  const [lotCentroids, setLotCentroids] = useState([]);

  // Flight timing calculation
  const flightTiming = useMemo(() => getFlightTiming(), []);
  const FLIGHT_TOTAL_DURATION = 120000;

  const normalizeLoteoGeojson = useMemo(
    () => normalizeLoteoFeatures(loteoGeojson),
    [loteoGeojson]
  );

  // Precalculate lot centroids for closest-lot identification during drone tour
  useEffect(() => {
    if (!normalizeLoteoGeojson) return;
    const centroids = normalizeLoteoGeojson.features
      .filter((feat) => feat.properties?.LOTE !== 'REMANENTE')
      .map((feat) => {
        const id = feat.properties.fid || feat.properties.OBJECTID || feat.properties.GLOBALID;
        const coords = feat.geometry.coordinates;
        const centroid = getCentroid(coords, feat.geometry.type);
        return {
          id,
          centroid,
          properties: feat.properties,
          coords,
          geometryType: feat.geometry.type
        };
      })
      .filter((c) => c.centroid !== null);
    setLotCentroids(centroids);
  }, [normalizeLoteoGeojson]);

  // Precalculate lot segment dimensions for showing "cotas" (medidas de cada tramo)
  const segmentCotasGeojson = useMemo(() => {
    if (!loteoGeojson) return null;

    const haversineDistance = (coords1, coords2) => {
      const lon1 = coords1[0], lat1 = coords1[1];
      const lon2 = coords2[0], lat2 = coords2[1];
      const R = 6371000; // Earth radius in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const features = [];
    loteoGeojson.features.forEach(feat => {
      if (!feat.geometry || feat.properties.LOTE === 'REMANENTE') return;
      const geomType = feat.geometry.type;
      const coords = feat.geometry.coordinates;

      const processRing = (ring) => {
        for (let i = 0; i < ring.length - 1; i++) {
          const p1 = ring[i];
          const p2 = ring[i+1];
          if (!Array.isArray(p1) || !Array.isArray(p2) || typeof p1[0] !== 'number' || typeof p2[0] !== 'number') continue;
          const dist = haversineDistance(p1, p2);
          
          // Skip extremely short segments (artifact vertices)
          if (dist < 1.0) continue;

          // Midpoint
          const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

          // Calculate angle for text rotation
          const c1 = maplibregl.MercatorCoordinate.fromLngLat(p1, 0);
          const c2 = maplibregl.MercatorCoordinate.fromLngLat(p2, 0);
          const dx = c2.x - c1.x;
          const dy = c2.y - c1.y;
          let angle = Math.atan2(dy, dx) * 180 / Math.PI;

          // Adjust angle for upright text readability
          if (angle > 90) angle -= 180;
          else if (angle < -90) angle += 180;

          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: mid
            },
            properties: {
              length: dist.toFixed(1) + ' m',
              angle: angle
            }
          });
        }
      };

      if (geomType === 'Polygon') {
        coords.forEach(processRing);
      } else if (geomType === 'MultiPolygon') {
        coords.forEach(polygon => {
          polygon.forEach(processRing);
        });
      }
    });

    return {
      type: 'FeatureCollection',
      features: features
    };
  }, [loteoGeojson]);

  // Center coordinates of San Pedro de Urabá project
  const centerLng = -76.39139889;
  const centerLat = 8.26558986;

  // ─── Stop flight (stable callback) ───
  const stopFlight = useCallback(() => {
    flightActiveRef.current = false;
    setFlightActive(false);
    setFlightProgress(0);
    setFlightLabel('');
    setFlightElapsed(0);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: 55,
        zoom: 17.5,
        bearing: -15,
        duration: 2000
      });
    }
  }, []);

  // Expose map controls to parent (Accessibility controls)
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (mapRef.current) mapRef.current.zoomIn({ duration: 800 });
    },
    zoomOut: () => {
      if (mapRef.current) mapRef.current.zoomOut({ duration: 800 });
    },
    rotateLeft: () => {
      if (mapRef.current) {
        const bearing = mapRef.current.getBearing();
        mapRef.current.easeTo({ bearing: bearing - 45, duration: 1000 });
      }
    },
    rotateRight: () => {
      if (mapRef.current) {
        const bearing = mapRef.current.getBearing();
        mapRef.current.easeTo({ bearing: bearing + 45, duration: 1000 });
      }
    },
    tiltUp: () => {
      if (mapRef.current) {
        const pitch = mapRef.current.getPitch();
        mapRef.current.easeTo({ pitch: Math.min(pitch + 15, 85), duration: 800 });
      }
    },
    tiltDown: () => {
      if (mapRef.current) {
        const pitch = mapRef.current.getPitch();
        mapRef.current.easeTo({ pitch: Math.max(pitch - 15, 0), duration: 800 });
      }
    },
    resetView: () => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [centerLng, centerLat],
          zoom: 17.5,
          pitch: 55,
          bearing: -15,
          duration: 1500
        });
      }
    },
    flyToLot: (lotId, coordinates, geometryType) => {
      if (!mapRef.current || !coordinates) return;
      
      let center = getCentroid(coordinates, geometryType || 'MultiPolygon');
      
      if (!center && lotCentroids.length > 0) {
        const found = lotCentroids.find(lc => lc.id === lotId);
        if (found) center = found.centroid;
      }
      
      if (!center || isNaN(center[0]) || isNaN(center[1])) {
        console.warn(`flyToLot: Cannot compute valid centroid for lot ${lotId}.`);
        return;
      }

      // Cinematic 3-step approach: pull back → orbit → dive in
      const map = mapRef.current;
      map.flyTo({
        center: center,
        zoom: 18.2,
        pitch: 55,
        bearing: map.getBearing(),
        duration: 1200,
        essential: true
      });
      
      setTimeout(() => {
        if (!mapRef.current) return;
        mapRef.current.flyTo({
          center: center,
          zoom: 19.5,
          pitch: 70,
          bearing: -30,
          duration: 1800,
          essential: true
        });
      }, 1300);
    },
    startStreetFlight: () => {
      startFlight();
    },
    stopStreetFlight: () => {
      stopFlight();
    },
    isFlightActive: () => flightActive,
    // Route animation API
    startRouteToLot: (lotCentroid, vType) => {
      startRouteAnimation(lotCentroid, vType);
    },
    stopRoute: () => {
      stopRouteAnimation();
    },
    isRouteActive: () => routeActive
  }));

  // Initialize Map
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          'satellite': {
            type: 'raster',
            tiles: [
              'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
              'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
              'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
              'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
            ],
            tileSize: 256,
            maxzoom: 20,
            attribution: '© Google Satellite'
          },
          'terrain-source': {
            type: 'raster-dem',
            tiles: [
              'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
            ],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 15
          }
        },
        layers: [
          {
            id: 'satellite-base',
            type: 'raster',
            source: 'satellite',
            paint: {
              'raster-brightness-max': 0.85,
              'raster-contrast': 0.15
            }
          }
        ]
      },
      center: [centerLng, centerLat],
      zoom: 17.5,
      pitch: 55,
      bearing: -15,
      antialias: true,
      maxPitch: 85,
      maxZoom: 22
    });

    mapRef.current = map;

    map.on('load', () => {
      map.setTerrain({ source: 'terrain-source', exaggeration: 1.5 });
      setMapLoaded(true);
    });

    return () => {
      stopFlight();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Load GeoJSON and custom Three.js layers once map is ready
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !normalizeLoteoGeojson) return;
    const map = mapRef.current;

    // 1. Manzana (Blocks background outline)
    if (manzanaGeojson) {
      if (!map.getSource('manzanas')) {
        map.addSource('manzanas', { type: 'geojson', data: manzanaGeojson });
        map.addLayer({
          id: 'manzanas-fill',
          type: 'fill',
          source: 'manzanas',
          paint: {
            'fill-color': '#14532d',
            'fill-opacity': 0.15
          }
        });

        // Add Manzana labels
        map.addLayer({
          id: 'manzana-labels',
          type: 'symbol',
          source: 'manzanas',
          minzoom: 14.5,
          maxzoom: 18.5,
          layout: {
            'text-field': ['get', 'Manzana'],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 12,
            'text-anchor': 'center',
            'text-allow-overlap': false
          },
          paint: {
            'text-color': '#eab308',
            'text-halo-color': '#020617',
            'text-halo-width': 1.5
          }
        });
      } else {
        map.getSource('manzanas').setData(manzanaGeojson);
      }
    }

    // 2. Loteo (Parcels bounds)
    if (!map.getSource('loteo')) {
      map.addSource('loteo', { type: 'geojson', data: normalizeLoteoGeojson });
      
      map.addLayer({
        id: 'loteo-fill',
        type: 'fill',
        source: 'loteo',
        filter: ['==', ['to-number', ['get', 'fid']], -1],
        paint: {
          'fill-color': 'rgba(0,0,0,0)',
          'fill-opacity': 1.0
        }
      });

      // Environmental heatmap flat layer - disabled (transparent)
      map.addLayer({
        id: 'loteo-environmental-fill',
        type: 'fill',
        source: 'loteo',
        paint: {
          'fill-color': 'rgba(0,0,0,0)',
          'fill-opacity': 0.0
        }
      });

      map.addLayer({
        id: 'loteo-line-base',
        type: 'line',
        source: 'loteo',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.8,
          'line-opacity': 0.75
        }
      });

      // Add Lot labels
      map.addLayer({
        id: 'loteo-labels',
        type: 'symbol',
        source: 'loteo',
        minzoom: 18.0,
        layout: {
          'text-field': [
            'concat',
            ['get', '_LABEL'],
            '\n',
            ['to-string', ['round', ['coalesce', ['get', 'AREA_M2'], ['get', 'SHAPE.AREA'], ['get', 'SHAPE_AREA'], 0]]], ' m² | ',
            ['to-string', ['round', ['coalesce', ['get', 'PERIMETER_M'], ['get', 'SHAPE.LEN'], ['get', 'SHAPE_LEN'], 0]]], ' m'
          ],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 10,
          'text-offset': [0, 0],
          'text-anchor': 'center',
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#020617',
          'text-halo-width': 1.2
        }
      });
    } else {
      map.getSource('loteo').setData(normalizeLoteoGeojson);
    }

    // Segment cotas (las medidas de cada tramo de los lotes)
    if (segmentCotasGeojson) {
      if (!map.getSource('loteo-segment-cotas')) {
        map.addSource('loteo-segment-cotas', { type: 'geojson', data: segmentCotasGeojson });
        map.addLayer({
          id: 'loteo-segment-cotas-labels',
          type: 'symbol',
          source: 'loteo-segment-cotas',
          minzoom: 18.2,
          layout: {
            'text-field': ['get', 'length'],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 9,
            'text-rotate': ['get', 'angle'],
            'text-rotation-alignment': 'map',
            'text-pitch-alignment': 'viewport',
            'text-offset': [0, -0.6],
            'text-allow-overlap': false
          },
          paint: {
            'text-color': '#fde047',
            'text-halo-color': '#070e08',
            'text-halo-width': 1.5
          }
        });
      } else {
        map.getSource('loteo-segment-cotas').setData(segmentCotasGeojson);
      }
    }

    // 3. Three.js Custom WebGL Layer for 3D Houses
    const housesLayer = map.getLayer('3d-houses-layer');
    if (!housesLayer) {
      const customLayer = {
        id: '3d-houses-layer',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (mapInstance, gl) {
          this.map = mapInstance;
          this.camera = new THREE.Camera();
          this.scene = new THREE.Scene();

          this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
          this.scene.add(this.ambientLight);

          this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
          this.dirLight.position.set(100, 200, 300).normalize();
          this.dirLight.castShadow = true;
          this.dirLight.shadow.mapSize.width = 2048;
          this.dirLight.shadow.mapSize.height = 2048;
          this.dirLight.shadow.camera.near = 0.5;
          this.dirLight.shadow.camera.far = 1000;
          this.dirLight.shadow.camera.left = -200;
          this.dirLight.shadow.camera.right = 200;
          this.dirLight.shadow.camera.top = 200;
          this.dirLight.shadow.camera.bottom = -200;
          this.dirLight.shadow.bias = -0.0001;
          this.scene.add(this.dirLight);

          this.fillLight = new THREE.DirectionalLight(0xadd8e6, 0.3);
          this.fillLight.position.set(-100, 100, 200).normalize();
          this.scene.add(this.fillLight);

          this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362907, 0.4);
          this.scene.add(this.hemiLight);

          this.neighborhood = createProceduralNeighborhood(this.scene, mapInstance, loteoGeojson, viasGeojson);
          if (this.neighborhood && typeof this.neighborhood.toggle3DMode === 'function') {
            this.neighborhood.toggle3DMode(viewMode === '3d');
          }
          this.setTimeOfDay(timeOfDay);

          this.renderer = new THREE.WebGLRenderer({
            canvas: mapInstance.getCanvas(),
            context: gl,
            antialias: true
          });
          this.renderer.autoClear = false;
          this.renderer.shadowMap.enabled = true;
          this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
          this.renderer.toneMappingExposure = 1.2;
          this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        },
        render: function (gl, matrix) {
          this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
          this.renderer.resetState();
          this.renderer.render(this.scene, this.camera);
          this.map.triggerRepaint();
        },
        onRemove: function (mapInstance, gl) {
          if (this.neighborhood) this.neighborhood.dispose();
          if (this.renderer) this.renderer.dispose();
        },
        setTimeOfDay: function (mode) {
          this.currentTimeOfDay = mode;
          if (!this.ambientLight || !this.dirLight) return;
          
          this.scene.fog = null;

          if (this.map && this.map.getLayer('satellite-base')) {
            if (mode === 'night') {
              this.map.setPaintProperty('satellite-base', 'raster-brightness-max', 0.25);
            } else if (mode === 'sunrise') {
              this.map.setPaintProperty('satellite-base', 'raster-brightness-max', 0.65);
            } else if (mode === 'sunset') {
              this.map.setPaintProperty('satellite-base', 'raster-brightness-max', 0.55);
            } else {
              this.map.setPaintProperty('satellite-base', 'raster-brightness-max', 0.85);
            }
          }

          if (mode === 'sunrise') {
            this.ambientLight.color.setHex(0xffeedd);
            this.ambientLight.intensity = 0.45;
            this.dirLight.color.setHex(0xffb703);
            this.dirLight.intensity = 0.65;
            this.dirLight.position.set(-200, -100, 50).normalize();
            this.scene.fog = new THREE.FogExp2(0xfef3c7, 0.005);
          } else if (mode === 'sunset') {
            this.ambientLight.color.setHex(0xffddcc);
            this.ambientLight.intensity = 0.45;
            this.dirLight.color.setHex(0xff5500);
            this.dirLight.intensity = 0.75;
            this.dirLight.position.set(200, 100, 40).normalize();
            this.scene.fog = new THREE.FogExp2(0xfed7aa, 0.004);
          } else if (mode === 'night') {
            this.ambientLight.color.setHex(0x0f172a);
            this.ambientLight.intensity = 0.25;
            this.dirLight.color.setHex(0x38bdf8);
            this.dirLight.intensity = 0.25;
            this.dirLight.position.set(-100, 200, 150).normalize();
            this.scene.fog = new THREE.FogExp2(0x020617, 0.007);
          } else {
            this.ambientLight.color.setHex(0xffffff);
            this.ambientLight.intensity = 0.85;
            this.dirLight.color.setHex(0xffffff);
            this.dirLight.intensity = 0.75;
            this.dirLight.position.set(200, 300, 400).normalize();
          }
          
          if (this.neighborhood && typeof this.neighborhood.updateLightMode === 'function') {
            this.neighborhood.updateLightMode(mode);
          }
          this.map.triggerRepaint();
        },
        updateNeighborhood: function (newLoteoGeojson, newViasGeojson) {
          if (this.neighborhood) this.neighborhood.dispose();
          if (this.scene && this.map) {
            this.neighborhood = createProceduralNeighborhood(this.scene, this.map, newLoteoGeojson, newViasGeojson || viasGeojson);
            this.setTimeOfDay(this.currentTimeOfDay || 'midday');
          }
        }
      };

      map.addLayer(customLayer);
    } else {
      if (housesLayer.implementation && typeof housesLayer.implementation.updateNeighborhood === 'function') {
        housesLayer.implementation.updateNeighborhood(loteoGeojson, viasGeojson);
      }
    }

    // 4. Predio (Property boundary)
    if (predioGeojson) {
      if (!map.getSource('predio')) {
        map.addSource('predio', { type: 'geojson', data: predioGeojson });
        map.addLayer({
          id: 'predio-line',
          type: 'line',
          source: 'predio',
          paint: {
            'line-color': '#38bdf8',
            'line-width': 2.5,
            'line-opacity': 0.85,
            'line-dasharray': [3, 2]
          }
        });

        map.addLayer({
          id: 'predio-labels',
          type: 'symbol',
          source: 'predio',
          minzoom: 14.0,
          maxzoom: 18.0,
          layout: {
            'text-field': 'Límite del Predio (San Pedro)',
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 11,
            'text-anchor': 'center',
            'text-allow-overlap': false,
            'symbol-placement': 'line'
          },
          paint: {
            'text-color': '#38bdf8',
            'text-halo-color': '#020617',
            'text-halo-width': 1.5
          }
        });
      } else {
        map.getSource('predio').setData(predioGeojson);
      }
    }

    // 5. Cotas (Elevation lines / dimensioning boundaries)
    if (cotasGeojson) {
      if (!map.getSource('cotas')) {
        map.addSource('cotas', { type: 'geojson', data: cotasGeojson });
        map.addLayer({
          id: 'cotas-lines',
          type: 'line',
          source: 'cotas',
          paint: {
            'line-color': '#a3e635',
            'line-width': 1.5,
            'line-opacity': 0.5
          }
        });
      } else {
        map.getSource('cotas').setData(cotasGeojson);
      }
    }

    // 6. Vías (Road lines)
    if (viasGeojson) {
      if (!map.getSource('vias')) {
        map.addSource('vias', { type: 'geojson', data: viasGeojson });
        map.addLayer({
          id: 'vias-casing',
          type: 'line',
          source: 'vias',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#334155',
            'line-width': 12,
            'line-opacity': 0.8
          }
        });

        map.addLayer({
          id: 'vias-center',
          type: 'line',
          source: 'vias',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#eab308',
            'line-width': 2,
            'line-dasharray': [3, 3],
            'line-opacity': 0.9
          }
        });
      } else {
        map.getSource('vias').setData(viasGeojson);
      }
    }

    // Click selection
    map.on('click', 'loteo-fill', (e) => {
      if (e.features.length > 0) {
        const feat = e.features[0];
        const props = feat.properties;
        const geom = feat.geometry;
        
        onSelectLot(extractLotInfo(feat));
      }
    });

    map.on('mousemove', 'loteo-fill', (e) => {
      if (e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        const feat = e.features[0];
        const info = extractLotInfo(feat);
        const override = adminOverrides[info.id] || {};
        const status = override.status || 'Disponible';
        const priceVal = override.price ? `$${Number(override.price).toLocaleString('es-CO')} COP` : 'Consultar';

        setHoveredLot({
          id: info.id,
          label: info.label,
          area: info.area,
          status: status,
          price: priceVal,
          x: e.point.x,
          y: e.point.y
        });
      }
    });

    map.on('mouseleave', 'loteo-fill', () => {
      map.getCanvas().style.cursor = '';
      setHoveredLot(null);
    });

  }, [mapLoaded, normalizeLoteoGeojson, manzanaGeojson, viasGeojson, predioGeojson, cotasGeojson, segmentCotasGeojson, adminOverrides]);

  // Handle selected lot highlight and admin overrides (sold/reserved colors/filters)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !normalizeLoteoGeojson) return;
    const map = mapRef.current;

    normalizeLoteoGeojson.features.forEach(feat => {
      const id = feat.properties.fid || feat.properties.OBJECTID || feat.properties.GLOBALID;
      map.setFeatureState(
        { source: 'loteo', id: id },
        { selected: id === selectedLotId }
      );
    });

    const soldLots = [];
    const reservedLots = [];
    Object.keys(adminOverrides).forEach(key => {
      const state = adminOverrides[key].status;
      if (state === 'Vendido') soldLots.push(Number(key));
      else if (state === 'Reservado') reservedLots.push(Number(key));
    });

    // Keep all non-remanente lots clickable and visible
    map.setFilter('loteo-fill', ['!=', ['get', 'LOTE'], 'REMANENTE']);

    const hoveredLotId = hoveredLot?.id || null;

    map.setPaintProperty('loteo-fill', 'fill-color', [
      'case',
      ['==', ['to-number', ['get', 'fid']], Number(selectedLotId || -1)], 'rgba(2, 132, 199, 0.4)', // Selected: Blue
      ['==', ['to-number', ['get', 'fid']], Number(hoveredLotId || -1)], [
        'case',
        ['in', ['to-number', ['get', 'fid']], ['literal', soldLots]], 'rgba(239, 68, 68, 0.25)', // Hover sold
        ['in', ['to-number', ['get', 'fid']], ['literal', reservedLots]], 'rgba(249, 115, 22, 0.25)', // Hover reserved
        'rgba(16, 185, 129, 0.25)' // Hover available
      ],
      ['in', ['to-number', ['get', 'fid']], ['literal', soldLots]], 'rgba(239, 68, 68, 0.15)', // Sold
      ['in', ['to-number', ['get', 'fid']], ['literal', reservedLots]], 'rgba(249, 115, 22, 0.15)', // Reserved
      'rgba(0,0,0,0)' // Available: transparent
    ]);

    map.setPaintProperty('loteo-line-base', 'line-color', [
      'case',
      ['==', ['to-number', ['get', 'fid']], Number(selectedLotId || -1)], '#0284c7', // Selected: Precision Blue
      ['==', ['to-number', ['get', 'fid']], Number(hoveredLotId || -1)], [
        'case',
        ['in', ['to-number', ['get', 'fid']], ['literal', soldLots]], '#ef4444',
        ['in', ['to-number', ['get', 'fid']], ['literal', reservedLots]], '#f97316',
        '#10b981' // Hover available: green
      ],
      ['in', ['to-number', ['get', 'fid']], ['literal', soldLots]], 'rgba(239, 68, 68, 0.4)',
      ['in', ['to-number', ['get', 'fid']], ['literal', reservedLots]], 'rgba(249, 115, 22, 0.4)',
      'rgba(255, 255, 255, 0.25)' // Default border
    ]);

    map.setPaintProperty('loteo-line-base', 'line-width', [
      'case',
      ['==', ['to-number', ['get', 'fid']], Number(selectedLotId || -1)], 3.5,
      ['==', ['to-number', ['get', 'fid']], Number(hoveredLotId || -1)], 2.5,
      1.5
    ]);
  }, [selectedLotId, adminOverrides, mapLoaded, normalizeLoteoGeojson, hoveredLot]);

  // Handle 2D / 3D Mode changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    
    // Toggle Three.js meshes visibility
    const housesLayer = map.getLayer('3d-houses-layer');
    if (housesLayer && housesLayer.implementation && typeof housesLayer.implementation.toggle3DMode === 'function') {
      housesLayer.implementation.toggle3DMode(viewMode === '3d');
    }
    
    // Animate camera to flat/3D perspective
    if (viewMode === '2d') {
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1500
      });
    } else {
      map.easeTo({
        pitch: 55,
        bearing: -15,
        duration: 1500
      });
    }
  }, [viewMode, mapLoaded]);

  // Handle 4D time of day changes in Three.js custom layer
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    const housesLayer = map.getLayer('3d-houses-layer');
    if (housesLayer && housesLayer.implementation && typeof housesLayer.implementation.setTimeOfDay === 'function') {
      housesLayer.implementation.setTimeOfDay(timeOfDay);
    }
  }, [timeOfDay, mapLoaded]);

  // Helper to calculate simulated environmental metrics
  const getEnvironmentalColorExpression = (layerType) => {
    if (layerType === 'ndvi') {
      const ndviVal = [
        '+',
        0.4,
        ['*', 0.4, ['/', ['+', ['sin', ['*', ['to-number', ['coalesce', ['get', 'fid'], ['get', 'OBJECTID'], 1]], 1.7]], 1.0], 2.0]]
      ];
      return [
        'interpolate', ['linear'], ndviVal,
        0.4, '#fde047',
        0.65, '#84cc16',
        0.8, '#15803d'
      ];
    }
    if (layerType === 'slope') {
      const slopeVal = [
        '+',
        2,
        ['*', 26, ['/', ['+', ['cos', ['*', ['to-number', ['coalesce', ['get', 'fid'], ['get', 'OBJECTID'], 1]], 2.3]], 1.0], 2.0]]
      ];
      return [
        'interpolate', ['linear'], slopeVal,
        4, '#22c55e',
        12, '#eab308',
        24, '#ef4444'
      ];
    }
    if (layerType === 'moisture') {
      const moistureVal = [
        '+',
        15,
        ['*', 70, ['/', ['+', ['sin', ['*', ['to-number', ['coalesce', ['get', 'fid'], ['get', 'OBJECTID'], 1]], 0.9]], 1.0], 2.0]]
      ];
      return [
        'interpolate', ['linear'], moistureVal,
        20, '#7c2d12',
        50, '#84cc16',
        80, '#0284c7'
      ];
    }
    return 'rgba(0,0,0,0)';
  };

  // Handle environmental layers changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    
    if (!map.getSource('loteo') || !map.getLayer('loteo-environmental-fill')) return;

    if (!environmentalLayer || environmentalLayer === 'satellite') {
      map.setPaintProperty('loteo-environmental-fill', 'fill-opacity', 0.0);
    } else {
      const colorExpr = getEnvironmentalColorExpression(environmentalLayer);
      map.setPaintProperty('loteo-environmental-fill', 'fill-color', colorExpr);
      map.setPaintProperty('loteo-environmental-fill', 'fill-opacity', 0.65);
    }
  }, [environmentalLayer, mapLoaded]);

  // ─────────────────────────────────────────────
  // CINEMATIC DRONE FLIGHT ENGINE
  // ─────────────────────────────────────────────

  // Voice narration for specific stations during drone tour
  const speakStation = useCallback((waypoint) => {
    if (!('speechSynthesis' in window) || !voiceEnabled) return;
    if (!waypoint || !waypoint.narration) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(waypoint.narration);
    utterance.lang = 'es-CO';
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) utterance.voice = spanishVoice;
    utterance.rate = 0.82;
    utterance.pitch = 1.05;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // Convert elapsed time to weighted progress along waypoints
  const elapsedToProgress = useCallback((elapsed) => {
    const { cumulativeWeights, totalWeight } = flightTiming;
    const N = flightWaypoints.length;

    // Normalized time [0, 1]
    const normalizedTime = Math.min(elapsed / FLIGHT_TOTAL_DURATION, 1.0);
    
    // Map normalized time to weighted position
    const targetWeight = normalizedTime * totalWeight;

    // Find which segment we're in
    for (let i = 0; i < N - 1; i++) {
      const segStart = cumulativeWeights[i];
      const segEnd = cumulativeWeights[i + 1];
      if (targetWeight >= segStart && targetWeight < segEnd) {
        const segProgress = (targetWeight - segStart) / (segEnd - segStart);
        return i + smoothstep(segProgress); // Smooth easing within each segment
      }
    }

    // Last segment
    const lastStart = cumulativeWeights[N - 1];
    const lastDuration = flightWaypoints[N - 1].duration || 1.0;
    const segProgress = Math.min((targetWeight - lastStart) / lastDuration, 1.0);
    return (N - 1) + smoothstep(segProgress);
  }, [flightTiming]);

  const startFlight = useCallback(() => {
    if (flightActiveRef.current || !mapRef.current) return;
    flightActiveRef.current = true;
    setFlightActive(true);

    const map = mapRef.current;
    startTimeRef.current = null;
    lastSpokenStationRef.current = -1;
    lastHighlightedLotIdRef.current = null;

    const N = flightWaypoints.length;

    const animate = (timestamp) => {
      if (!flightActiveRef.current) return; // Check ref, not state

      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      // Tour complete
      if (elapsed >= FLIGHT_TOTAL_DURATION) {
        stopFlight();
        return;
      }

      // Convert elapsed to weighted progress
      const progress = elapsedToProgress(elapsed);
      const index = Math.min(Math.floor(progress), N - 2); // Clamp to valid spline range
      const t = progress - Math.floor(progress);

      // Catmull-Rom requires 4 control points (p0, p1, p2, p3)
      const p0 = flightWaypoints[Math.max(0, index - 1)];
      const p1 = flightWaypoints[index];
      const p2 = flightWaypoints[Math.min(N - 1, index + 1)];
      const p3 = flightWaypoints[Math.min(N - 1, index + 2)];

      // Interpolate all camera parameters with Catmull-Rom
      const lng = catmullRom(p0.lng, p1.lng, p2.lng, p3.lng, t);
      const lat = catmullRom(p0.lat, p1.lat, p2.lat, p3.lat, t);
      const zoom = catmullRom(p0.zoom, p1.zoom, p2.zoom, p3.zoom, t);
      const pitch = catmullRom(p0.pitch, p1.pitch, p2.pitch, p3.pitch, t);
      
      // Bearing: look-ahead calculation for natural camera tracking
      // Calculate direction towards next waypoint and blend
      const bearingBase = lerpAngle(p1.bearing, p2.bearing, t);
      
      // Subtle cinematic sweep (gentler than before, ±8° oscillation)
      const isOverview = index === 0 || index >= N - 2;
      const sweepAmplitude = isOverview ? 0 : 8;
      const sweep = Math.sin(progress * Math.PI * 0.8) * sweepAmplitude;
      const finalBearing = bearingBase + sweep;

      // Apply camera with smoother cinematic easing and stable pacing
      map.easeTo({
        center: [lng, lat],
        zoom: Math.min(22, zoom),
        pitch: Math.max(0, Math.min(85, pitch)),
        bearing: finalBearing,
        duration: 220,
        easing: t => t * t * (3 - 2 * t)
      });

      // Update HUD state (throttled to ~10fps for performance)
      if (Math.floor(elapsed / 100) !== Math.floor((elapsed - 16) / 100)) {
        setFlightProgress(progress);
        setFlightElapsed(elapsed);
        setFlightLabel(p1.label || '');
      }

      // Station voice narration sync
      const currentStation = Math.floor(progress);
      if (currentStation !== lastSpokenStationRef.current && currentStation < N) {
        lastSpokenStationRef.current = currentStation;
        speakStation(flightWaypoints[currentStation]);
      }

      // Automated Lot Highlighting (closest lot to camera)
      // Fix: previous lon/lat squared-distance threshold was not metric-safe.
      if (lotCentroids.length > 0 && zoom >= 18.0) {
        let nearest = null;
        let minD = Infinity;
        const cameraPoint = [lng, lat];

        lotCentroids.forEach((lc) => {
          if (!lc.centroid || lc.properties?.LOTE === 'REMANENTE') return;
          const distM = haversineDistanceMeters(cameraPoint, lc.centroid);
          if (distM < minD) {
            minD = distM;
            nearest = lc;
          }
        });

        const thresholdM = zoom >= 19.5 ? 5 : zoom >= 19.0 ? 8 : 12;

        if (minD <= thresholdM && nearest && lastHighlightedLotIdRef.current !== nearest.id) {
          lastHighlightedLotIdRef.current = nearest.id;
          onSelectLot(extractLotInfo({
            properties: nearest.properties,
            geometry: { type: nearest.geometryType || 'MultiPolygon', coordinates: nearest.coords }
          }), true);
        }
      }


      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
  }, [lotCentroids, voiceEnabled, speakStation, elapsedToProgress, stopFlight, onSelectLot]);

  // ─────────────────────────────────────────────
  // ROUTE ANIMATION ENGINE
  // ─────────────────────────────────────────────
  const stopRouteAnimation = useCallback(() => {
    routeActiveRef.current = false;
    setRouteActive(false);
    setRouteProgress(0);
    if (routeReqRef.current) {
      cancelAnimationFrame(routeReqRef.current);
      routeReqRef.current = null;
    }
    // Remove route layers and marker
    if (mapRef.current) {
      try {
        if (mapRef.current.getLayer('route-line')) mapRef.current.removeLayer('route-line');
        if (mapRef.current.getLayer('route-line-glow')) mapRef.current.removeLayer('route-line-glow');
        if (mapRef.current.getSource('route-path')) mapRef.current.removeSource('route-path');
        if (mapRef.current.getLayer('vehicle-marker')) mapRef.current.removeLayer('vehicle-marker');
        if (mapRef.current.getSource('vehicle-point')) mapRef.current.removeSource('vehicle-point');
      } catch(e) { /* layers may not exist */ }
    }
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }
  }, []);

  const startRouteAnimation = useCallback((lotCentroid, vType) => {
    if (!mapRef.current || !viasGeojson || !lotCentroid) return;
    
    // Stop any existing animation
    stopRouteAnimation();
    stopFlight();
    
    const map = mapRef.current;
    const vt = vType || vehicleType;
    setVehicleType(vt);
    
    // Calculate route
    const routeData = calculateRouteToLot(viasGeojson, lotCentroid);
    if (!routeData || routeData.route.length < 2) {
      console.warn('Could not calculate route to lot');
      return;
    }
    
    routeDataRef.current = routeData;
    const dist = getRouteDistance(routeData.route);
    setRouteDistance(dist);
    
    // Add route path to map
    const routeGeoJSON = routeToGeoJSON(routeData.route);
    if (routeGeoJSON) {
      if (!map.getSource('route-path')) {
        map.addSource('route-path', { type: 'geojson', data: routeGeoJSON });
      } else {
        map.getSource('route-path').setData(routeGeoJSON);
      }
      
      if (!map.getLayer('route-line-glow')) {
        map.addLayer({
          id: 'route-line-glow',
          type: 'line',
          source: 'route-path',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#38bdf8', 'line-width': 8, 'line-opacity': 0.25, 'line-blur': 4 }
        });
      }
      if (!map.getLayer('route-line')) {
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-path',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#38bdf8', 'line-width': 3, 'line-opacity': 0.9, 'line-dasharray': [2, 1] }
        });
      }
    }
    
    // Create vehicle marker (HTML marker for emoji)
    const vConfig = VEHICLE_TYPES[vt];
    const el = document.createElement('div');
    el.style.cssText = 'font-size:28px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));transition:transform 0.1s linear;pointer-events:none;';
    el.textContent = vConfig.emoji;
    const marker = new maplibregl.Marker({ element: el, anchor: 'center', rotationAlignment: 'map' })
      .setLngLat(routeData.route[0])
      .addTo(map);
    vehicleMarkerRef.current = marker;
    
    // Start animation
    routeActiveRef.current = true;
    setRouteActive(true);
    routeStartTimeRef.current = null;
    routeCameraRef.current = null;
    
    const vSpeed = vConfig.speed;
    const animDuration = (dist / vSpeed) * 1000; // ms
    
    const animateRoute = (timestamp) => {
      if (!routeActiveRef.current) return;
      if (!routeStartTimeRef.current) routeStartTimeRef.current = timestamp;
      
      const elapsed = timestamp - routeStartTimeRef.current;
      const progress = Math.min(elapsed / animDuration, 1.0);
      const easedProgress = smoothstep(progress);
      
      const pos = interpolateRoute(routeData.route, easedProgress);
      if (pos) {
        // Update marker
        if (vehicleMarkerRef.current) {
          vehicleMarkerRef.current.setLngLat([pos.lng, pos.lat]);
          vehicleMarkerRef.current.setRotation(pos.bearing || 0);
          const markerEl = vehicleMarkerRef.current.getElement();
          if (markerEl) {
            markerEl.style.display = (cameraMode === 'first') ? 'none' : 'block';
          }
        }
        
        // Update camera with smoothing to reduce jitter
        const currentMode = cameraMode || 'third';
        const targetCam = getCameraForPerspective(pos, currentMode, pos.bearing, vt);
        const smooth = 0.18;
        if (!routeCameraRef.current) {
          routeCameraRef.current = targetCam;
        } else {
          const prev = routeCameraRef.current;
          const bearingDelta = ((targetCam.bearing - prev.bearing + 540) % 360) - 180;
          routeCameraRef.current = {
            center: [
              lerp(prev.center[0], targetCam.center[0], smooth),
              lerp(prev.center[1], targetCam.center[1], smooth)
            ],
            zoom: lerp(prev.zoom, targetCam.zoom, smooth),
            pitch: lerp(prev.pitch, targetCam.pitch, smooth),
            bearing: prev.bearing + bearingDelta * smooth
          };
        }
        map.jumpTo(routeCameraRef.current);
      }
      
      // Update HUD
      if (Math.floor(elapsed / 80) !== Math.floor((elapsed - 16) / 80)) {
        setRouteProgress(easedProgress);
      }
      
      if (progress >= 1.0) {
        // Arrival! Do a cinematic orbit around the lot
        setTimeout(() => {
          if (mapRef.current && lotCentroid) {
            mapRef.current.flyTo({
              center: lotCentroid,
              zoom: 19.5,
              pitch: 68,
              bearing: mapRef.current.getBearing() + 90,
              duration: 3000
            });
          }
          setTimeout(() => stopRouteAnimation(), 3500);
        }, 500);
        return;
      }
      
      routeReqRef.current = requestAnimationFrame(animateRoute);
    };
    
    // Zoom to route start first
    map.flyTo({
      center: routeData.route[0],
      zoom: 18.5,
      pitch: 65,
      bearing: 0,
      duration: 1500
    });
    
    setTimeout(() => {
      if (routeActiveRef.current) {
        routeReqRef.current = requestAnimationFrame(animateRoute);
      }
    }, 1600);
    
  }, [viasGeojson, vehicleType, cameraMode, stopRouteAnimation, stopFlight]);

  // Cycle vehicle types
  const cycleVehicle = useCallback(() => {
    const types = Object.keys(VEHICLE_TYPES);
    const idx = types.indexOf(vehicleType);
    const next = types[(idx + 1) % types.length];
    setVehicleType(next);
    // Update marker emoji
    if (vehicleMarkerRef.current) {
      const el = vehicleMarkerRef.current.getElement();
      if (el) el.textContent = VEHICLE_TYPES[next].emoji;
    }
  }, [vehicleType]);

  // Cycle camera modes  
  const cycleCameraMode = useCallback(() => {
    const modes = Object.keys(CAMERA_MODES);
    const idx = modes.indexOf(cameraMode || 'third');
    const next = modes[(idx + 1) % modes.length];
    if (setCameraMode) setCameraMode(next);
  }, [cameraMode, setCameraMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRouteAnimation();
    };
  }, [stopRouteAnimation]);

  return (
    <>
      <div className="map-container" ref={mapContainerRef} />
      
      {/* Map Hover Tooltip */}
      {hoveredLot && (
        <div
          className="map-tooltip"
          style={{
            left: hoveredLot.x + 15,
            top: hoveredLot.y + 15,
          }}
        >
          <div className="map-tooltip-header">
            <span>{hoveredLot.label}</span>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: hoveredLot.status === 'Disponible' ? 'var(--status-available)' :
                               hoveredLot.status === 'Reservado' ? 'var(--status-reserved)' :
                               'var(--status-sold)',
              display: 'inline-block'
            }} />
          </div>
          <div className="map-tooltip-row">
            <span className="map-tooltip-label">Área:</span>
            <span className="map-tooltip-value">{Math.round(hoveredLot.area)} m²</span>
          </div>
          <div className="map-tooltip-row">
            <span className="map-tooltip-label">Estado:</span>
            <span className="map-tooltip-value" style={{
              color: hoveredLot.status === 'Disponible' ? 'var(--status-available)' :
                     hoveredLot.status === 'Reservado' ? 'var(--status-reserved)' :
                     'var(--status-sold)'
            }}>{hoveredLot.status}</span>
          </div>
          <div className="map-tooltip-row">
            <span className="map-tooltip-label">Precio:</span>
            <span className="map-tooltip-value" style={{ color: 'var(--gold-300)' }}>{hoveredLot.price}</span>
          </div>
        </div>
      )}

      {/* Flight HUD Overlay */}
      {flightActive && (
        <FlightHUD
          progress={flightProgress}
          totalStations={flightWaypoints.length}
          currentLabel={flightLabel}
          elapsed={flightElapsed}
          totalDuration={FLIGHT_TOTAL_DURATION}
          onStop={stopFlight}
        />
      )}

      {/* Route Animation HUD */}
      {routeActive && (
        <RouteHUD
          vehicleType={vehicleType}
          cameraMode={cameraMode || 'third'}
          progress={routeProgress}
          distance={routeDistance}
          onStop={stopRouteAnimation}
          onCycleCamera={cycleCameraMode}
          onCycleVehicle={cycleVehicle}
        />
      )}
    </>
  );
});

export default Map3D;

import * as THREE from 'three';
import maplibregl from 'maplibre-gl';

// Helper to calculate polygon centroid
const getCentroid = (coords) => {
  const points = [];
  const collect = (arr) => {
    if (Array.isArray(arr) && arr.length === 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      points.push(arr);
    } else if (Array.isArray(arr)) {
      arr.forEach(collect);
    }
  };
  collect(coords);
  if (points.length === 0) return [0, 0];
  let lon = 0, lat = 0;
  points.forEach(pt => {
    lon += pt[0];
    lat += pt[1];
  });
  return [lon / points.length, lat / points.length];
};

// Helper to sample points along roads for placing streetlights
const sampleViasForStreetlights = (viasGeojson, mapInstance, spacingMeters = 30) => {
  const points = [];
  if (!viasGeojson || !viasGeojson.features) return points;

  viasGeojson.features.forEach(feat => {
    if (!feat.geometry) return;
    const coords = feat.geometry.coordinates;
    const type = feat.geometry.type;

    const processLine = (line) => {
      let leftSide = true;

      for (let i = 0; i < line.length - 1; i++) {
        const pt1 = line[i];
        const pt2 = line[i+1];

        // Convert coordinates to Mercator
        const c1 = maplibregl.MercatorCoordinate.fromLngLat(pt1, 0);
        const c2 = maplibregl.MercatorCoordinate.fromLngLat(pt2, 0);
        
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const meterScale = c1.meterInMercatorCoordinateUnits();
        if (meterScale === 0) continue;
        
        const segmentDist = Math.sqrt(dx*dx + dy*dy) / meterScale;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len === 0) continue;

        // Direction and normal vectors
        const dirX = dx / len;
        const dirY = dy / len;
        const normX = -dirY;
        const normY = dirX;

        let step = spacingMeters / 2; // Offset first light
        while (step < segmentDist) {
          const t = step / segmentDist;
          
          // Center point on road
          const mx = c1.x + dx * t;
          const my = c1.y + dy * t;

          // Offset to the side of the road (approx 4.5 meters out)
          const offsetDist = 4.5 * meterScale;
          const sideFactor = leftSide ? 1 : -1;
          const sx = mx + normX * offsetDist * sideFactor;
          const sy = my + normY * offsetDist * sideFactor;

          // Get elevation at this point
          const lngLat = new maplibregl.MercatorCoordinate(sx, sy, 0).toLngLat();
          const elevation = mapInstance.getTerrain() ? mapInstance.queryTerrainElevation([lngLat.lng, lngLat.lat]) : 0;
          const mercatorPt = maplibregl.MercatorCoordinate.fromLngLat([lngLat.lng, lngLat.lat], elevation);

          points.push({
            position: new THREE.Vector3(mercatorPt.x, mercatorPt.y, mercatorPt.z),
            rotationAngle: Math.atan2(dy, dx), // Road angle
            meterScale: meterScale,
            leftSide: leftSide
          });

          leftSide = !leftSide; // Alternate side of the road
          step += spacingMeters;
        }
      }
    };

    if (type === 'LineString') {
      processLine(coords);
    } else if (type === 'MultiLineString') {
      coords.forEach(processLine);
    }
  });

  return points;
};

export const createProceduralNeighborhood = (scene, mapInstance, loteoGeojson, viasGeojson) => {
  const features = loteoGeojson ? loteoGeojson.features.filter(feat => {
    return feat.properties.LOTE !== 'REMANENTE';
  }) : [];

  const count = features.length;

  // 1. Geometries - Enhanced for Revit/SketchUp quality
  const lawnGeom = new THREE.BoxGeometry(7.8, 0.15, 15.8);
  const drivewayGeom = new THREE.BoxGeometry(2.8, 0.06, 4.5);
  const foundationGeom = new THREE.BoxGeometry(6.6, 0.3, 9.8);
  
  // Style A (Classic) geometries - More detailed
  const wallClassicGeom = new THREE.BoxGeometry(6.4, 4.5, 9.5);
  const wallAccentGeom = new THREE.BoxGeometry(6.45, 0.3, 9.55);
  const roofBaseGeom = new THREE.BoxGeometry(6.8, 0.25, 10.0);
  const roofClassicGeom = new THREE.CylinderGeometry(0.1, 4.3, 10.2, 4, 1);
  const roofOverhangGeom = new THREE.BoxGeometry(7.0, 0.15, 10.2);
  const doorClassicGeom = new THREE.BoxGeometry(1.3, 2.4, 0.18);
  const doorFrameGeom = new THREE.BoxGeometry(1.5, 2.6, 0.1);
  const windowClassicGeom = new THREE.BoxGeometry(1.7, 1.4, 0.18);
  const windowFrameGeom = new THREE.BoxGeometry(1.9, 1.6, 0.1);

  // Style B (Premium Double Height) geometries
  const wallPremiumGeom = new THREE.BoxGeometry(6.4, 8.0, 9.5);
  const wallBaseGeom = new THREE.BoxGeometry(6.5, 0.4, 9.6);
  const wallCapGeom = new THREE.BoxGeometry(6.45, 0.25, 9.55);
  const roofPremiumGeom = new THREE.BoxGeometry(6.8, 0.5, 10.0);
  const roofEdgeGeom = new THREE.BoxGeometry(6.9, 0.2, 10.1);
  const doorPremiumGeom = new THREE.BoxGeometry(2.0, 2.6, 0.2);
  const doorFramePremiumGeom = new THREE.BoxGeometry(2.2, 2.8, 0.12);
  const windowPremiumGeom = new THREE.BoxGeometry(2.6, 4.8, 0.2);
  const windowFramePremiumGeom = new THREE.BoxGeometry(2.8, 5.0, 0.12);
  const poolBorderGeom = new THREE.BoxGeometry(3.4, 0.15, 5.0);
  const poolWaterGeom = new THREE.BoxGeometry(3.0, 0.18, 4.6);
  const poolEdgeGeom = new THREE.BoxGeometry(3.6, 0.08, 5.2);
  const solarPanelGeom = new THREE.BoxGeometry(2.0, 0.08, 1.4);
  const solarFrameGeom = new THREE.BoxGeometry(2.2, 0.12, 1.6);

  // Vegetation geometries - More natural
  const trunkGeom = new THREE.CylinderGeometry(0.12, 0.18, 3.0, 8);
  const foliageGeom = new THREE.SphereGeometry(1.3, 12, 10);
  const foliageLowGeom = new THREE.SphereGeometry(1.0, 10, 8);
  const shrubGeom = new THREE.SphereGeometry(0.7, 10, 8);
  const shrubSmallGeom = new THREE.SphereGeometry(0.5, 8, 6);

  // Streetlight geometries
  const slPoleGeom = new THREE.CylinderGeometry(0.08, 0.12, 5.5, 8);
  const slBaseGeom = new THREE.CylinderGeometry(0.15, 0.18, 0.3, 8);
  const slArmGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6);
  const slArmJointGeom = new THREE.SphereGeometry(0.08, 6, 6);
  const slBulbGeom = new THREE.SphereGeometry(0.2, 10, 10);
  const slReflectorGeom = new THREE.CylinderGeometry(0.15, 0.2, 0.1, 8);

  // 2. Materials - PBR Quality for Revit/Blender look
  const lawnMat = new THREE.MeshStandardMaterial({ 
    color: 0x3d7c47, 
    roughness: 0.95,
    metalness: 0.0
  });
  const drivewayMat = new THREE.MeshStandardMaterial({ 
    color: 0x4a5568, 
    roughness: 0.85,
    metalness: 0.1
  });
  const foundationMat = new THREE.MeshStandardMaterial({ 
    color: 0x2d3748, 
    roughness: 0.7,
    metalness: 0.2
  });
  
  // Classic style materials - Warm residential palette
  const wallClassicMat = new THREE.MeshStandardMaterial({ 
    color: 0xfaf5e4, 
    roughness: 0.75,
    metalness: 0.05
  });
  const wallAccentMat = new THREE.MeshStandardMaterial({ 
    color: 0xe8dcc8, 
    roughness: 0.7,
    metalness: 0.05
  });
  const roofBaseMat = new THREE.MeshStandardMaterial({ 
    color: 0x5a3e2b, 
    roughness: 0.6,
    metalness: 0.1
  });
  const roofClassicMat = new THREE.MeshStandardMaterial({ 
    color: 0x8b3a2b, 
    roughness: 0.5,
    metalness: 0.15
  });
  const roofOverhangMat = new THREE.MeshStandardMaterial({ 
    color: 0x6b4423, 
    roughness: 0.55,
    metalness: 0.1
  });
  const doorClassicMat = new THREE.MeshStandardMaterial({ 
    color: 0x5c4033, 
    roughness: 0.8,
    metalness: 0.1
  });
  const doorFrameMat = new THREE.MeshStandardMaterial({ 
    color: 0x3d2817, 
    roughness: 0.7,
    metalness: 0.2
  });
  
  // Premium style materials - Modern architectural
  const wallPremiumMat = new THREE.MeshStandardMaterial({ 
    color: 0xf7fafc, 
    roughness: 0.55,
    metalness: 0.1
  });
  const wallBaseMat = new THREE.MeshStandardMaterial({ 
    color: 0xe2e8f0, 
    roughness: 0.5,
    metalness: 0.15
  });
  const wallCapMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a202c, 
    roughness: 0.4,
    metalness: 0.3
  });
  const roofPremiumMat = new THREE.MeshStandardMaterial({ 
    color: 0x2d3748, 
    roughness: 0.35,
    metalness: 0.25
  });
  const roofEdgeMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a202c, 
    roughness: 0.3,
    metalness: 0.35
  });
  const doorPremiumMat = new THREE.MeshStandardMaterial({ 
    color: 0x3c2415, 
    roughness: 0.75,
    metalness: 0.15
  });
  const doorFramePremiumMat = new THREE.MeshStandardMaterial({ 
    color: 0x2d1f14, 
    roughness: 0.65,
    metalness: 0.25
  });
  
  // Glass materials - Realistic reflection
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x87ceeb,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.9,
    thickness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    ior: 1.5,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.0
  });

  const windowFrameMat = new THREE.MeshStandardMaterial({ 
    color: 0x2d3748, 
    roughness: 0.4,
    metalness: 0.5
  });
  const windowFramePremiumMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a202c, 
    roughness: 0.35,
    metalness: 0.6
  });
  
  const poolBorderMat = new THREE.MeshStandardMaterial({ 
    color: 0xe2e8f0, 
    roughness: 0.4,
    metalness: 0.1
  });
  const poolWaterMat = new THREE.MeshPhysicalMaterial({ 
    color: 0x0ea5e9, 
    roughness: 0.1, 
    metalness: 0.0,
    transmission: 0.7,
    thickness: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });
  const poolEdgeMat = new THREE.MeshStandardMaterial({ 
    color: 0xcbd5e0, 
    roughness: 0.35,
    metalness: 0.15
  });
  const solarPanelMat = new THREE.MeshStandardMaterial({ 
    color: 0x1e293b, 
    roughness: 0.15, 
    metalness: 0.95
  });
  const solarFrameMat = new THREE.MeshStandardMaterial({ 
    color: 0x334155, 
    roughness: 0.3, 
    metalness: 0.8
  });

  // Glass/Emissive materials
  const glassMatEmissive = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    metalness: 0.9,
    roughness: 0.1,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.0
  });

  const trunkMat = new THREE.MeshStandardMaterial({ 
    color: 0x5c4033,
    roughness: 0.9 
  });
  const foliageMat = new THREE.MeshStandardMaterial({ 
    color: 0x22543d, 
    roughness: 0.95,
    metalness: 0.0
  });
  const foliageLowMat = new THREE.MeshStandardMaterial({ 
    color: 0x276749, 
    roughness: 0.95,
    metalness: 0.0
  });
  const fruitFoliageMat = new THREE.MeshStandardMaterial({ 
    color: 0x15803d, 
    roughness: 0.95,
    metalness: 0.0
  });

  // Streetlight materials
  const slMetalMat = new THREE.MeshStandardMaterial({ 
    color: 0x2d3748, 
    roughness: 0.35, 
    metalness: 0.9 
  });
  const slBulbMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.0
  });
  const slReflectorMat = new THREE.MeshStandardMaterial({
    color: 0xfefce8,
    metalness: 0.3,
    roughness: 0.2,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.0
  });

  // 4. Sample and build streetlights
  const streetlightPoints = sampleViasForStreetlights(viasGeojson, mapInstance, 25);
  const slCount = streetlightPoints.length;

  // 3. Create Instanced Meshes - Enhanced detail
  const instancedLawn = new THREE.InstancedMesh(lawnGeom, lawnMat, count);
  const instancedDriveway = new THREE.InstancedMesh(drivewayGeom, drivewayMat, count);
  const instancedFoundation = new THREE.InstancedMesh(foundationGeom, foundationMat, count);
  
  // Classic with details
  const instancedWallClassic = new THREE.InstancedMesh(wallClassicGeom, wallClassicMat, count);
  const instancedWallAccent = new THREE.InstancedMesh(wallAccentGeom, wallAccentMat, count);
  const instancedRoofBase = new THREE.InstancedMesh(roofBaseGeom, roofBaseMat, count);
  const instancedRoofClassic = new THREE.InstancedMesh(roofClassicGeom, roofClassicMat, count);
  const instancedRoofOverhang = new THREE.InstancedMesh(roofOverhangGeom, roofOverhangMat, count);
  const instancedDoorClassic = new THREE.InstancedMesh(doorClassicGeom, doorClassicMat, count);
  const instancedDoorFrame = new THREE.InstancedMesh(doorFrameGeom, doorFrameMat, count);
  const instancedWindowClassic = new THREE.InstancedMesh(windowClassicGeom, glassMat, count);
  const instancedWindowFrame = new THREE.InstancedMesh(windowFrameGeom, windowFrameMat, count);

  // Premium with details
  const instancedWallPremium = new THREE.InstancedMesh(wallPremiumGeom, wallPremiumMat, count);
  const instancedWallBase = new THREE.InstancedMesh(wallBaseGeom, wallBaseMat, count);
  const instancedWallCap = new THREE.InstancedMesh(wallCapGeom, wallCapMat, count);
  const instancedRoofPremium = new THREE.InstancedMesh(roofPremiumGeom, roofPremiumMat, count);
  const instancedRoofEdge = new THREE.InstancedMesh(roofEdgeGeom, roofEdgeMat, count);
  const instancedDoorPremium = new THREE.InstancedMesh(doorPremiumGeom, doorPremiumMat, count);
  const instancedDoorFramePremium = new THREE.InstancedMesh(doorFramePremiumGeom, doorFramePremiumMat, count);
  const instancedWindowPremium = new THREE.InstancedMesh(windowPremiumGeom, glassMat, count);
  const instancedWindowFramePremium = new THREE.InstancedMesh(windowFramePremiumGeom, windowFramePremiumMat, count);
  const instancedPoolBorder = new THREE.InstancedMesh(poolBorderGeom, poolBorderMat, count);
  const instancedPoolEdge = new THREE.InstancedMesh(poolEdgeGeom, poolEdgeMat, count);
  const instancedPoolWater = new THREE.InstancedMesh(poolWaterGeom, poolWaterMat, count);
  const instancedSolarPanel = new THREE.InstancedMesh(solarPanelGeom, solarPanelMat, count);
  const instancedSolarFrame = new THREE.InstancedMesh(solarFrameGeom, solarFrameMat, count);

  // Vegetation - enhanced
  const instancedTrunk = new THREE.InstancedMesh(trunkGeom, trunkMat, count * 4); 
  const instancedFoliage = new THREE.InstancedMesh(foliageGeom, foliageMat, count * 4);
  const instancedFoliageLow = new THREE.InstancedMesh(foliageLowGeom, foliageLowMat, count * 2);
  const instancedShrub = new THREE.InstancedMesh(shrubGeom, fruitFoliageMat, count * 6);
  const instancedShrubSmall = new THREE.InstancedMesh(shrubSmallGeom, fruitFoliageMat, count * 4);

  // Streetlight geometries - enhanced
  const instancedSlPole = new THREE.InstancedMesh(slPoleGeom, slMetalMat, slCount || 1);
  const instancedSlBase = new THREE.InstancedMesh(slBaseGeom, slMetalMat, slCount || 1);
  const instancedSlArm = new THREE.InstancedMesh(slArmGeom, slMetalMat, slCount || 1);
  const instancedSlArmJoint = new THREE.InstancedMesh(slArmJointGeom, slMetalMat, slCount || 1);
  const instancedSlBulb = new THREE.InstancedMesh(slBulbGeom, slBulbMat, slCount || 1);
  const instancedSlReflector = new THREE.InstancedMesh(slReflectorGeom, slReflectorMat, slCount || 1);

  const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  const matrix = new THREE.Matrix4();

  let trunkIndex = 0;
  let shrubIndex = 0;

  for (let i = 0; i < count; i++) {
    instancedLawn.setMatrixAt(i, zeroMatrix);
    instancedDriveway.setMatrixAt(i, zeroMatrix);
    instancedFoundation.setMatrixAt(i, zeroMatrix);
    instancedWallClassic.setMatrixAt(i, zeroMatrix);
    instancedWallAccent.setMatrixAt(i, zeroMatrix);
    instancedRoofBase.setMatrixAt(i, zeroMatrix);
    instancedRoofClassic.setMatrixAt(i, zeroMatrix);
    instancedRoofOverhang.setMatrixAt(i, zeroMatrix);
    instancedDoorClassic.setMatrixAt(i, zeroMatrix);
    instancedDoorFrame.setMatrixAt(i, zeroMatrix);
    instancedWindowClassic.setMatrixAt(i, zeroMatrix);
    instancedWindowFrame.setMatrixAt(i, zeroMatrix);
    instancedWallPremium.setMatrixAt(i, zeroMatrix);
    instancedWallBase.setMatrixAt(i, zeroMatrix);
    instancedWallCap.setMatrixAt(i, zeroMatrix);
    instancedRoofPremium.setMatrixAt(i, zeroMatrix);
    instancedRoofEdge.setMatrixAt(i, zeroMatrix);
    instancedDoorPremium.setMatrixAt(i, zeroMatrix);
    instancedDoorFramePremium.setMatrixAt(i, zeroMatrix);
    instancedWindowPremium.setMatrixAt(i, zeroMatrix);
    instancedWindowFramePremium.setMatrixAt(i, zeroMatrix);
    instancedPoolBorder.setMatrixAt(i, zeroMatrix);
    instancedPoolEdge.setMatrixAt(i, zeroMatrix);
    instancedPoolWater.setMatrixAt(i, zeroMatrix);
    instancedSolarPanel.setMatrixAt(i, zeroMatrix);
    instancedSolarFrame.setMatrixAt(i, zeroMatrix);
  }

  for (let i = 0; i < count * 4; i++) {
    instancedTrunk.setMatrixAt(i, zeroMatrix);
    instancedFoliage.setMatrixAt(i, zeroMatrix);
  }
  for (let i = 0; i < count * 2; i++) {
    instancedFoliageLow.setMatrixAt(i, zeroMatrix);
  }
  for (let i = 0; i < count * 6; i++) {
    instancedShrub.setMatrixAt(i, zeroMatrix);
  }
  for (let i = 0; i < count * 4; i++) {
    instancedShrubSmall.setMatrixAt(i, zeroMatrix);
  }
  for (let i = 0; i < slCount; i++) {
    instancedSlPole.setMatrixAt(i, zeroMatrix);
    instancedSlBase.setMatrixAt(i, zeroMatrix);
    instancedSlArm.setMatrixAt(i, zeroMatrix);
    instancedSlArmJoint.setMatrixAt(i, zeroMatrix);
    instancedSlBulb.setMatrixAt(i, zeroMatrix);
    instancedSlReflector.setMatrixAt(i, zeroMatrix);
  }

  // 5. Position Lot instances
  features.forEach((feat, lotIdx) => {
    const coords = feat.geometry.coordinates;
    const centroid = getCentroid(coords);

    const elevation = mapInstance.getTerrain() ? mapInstance.queryTerrainElevation(centroid) : 0;
    const mercator = maplibregl.MercatorCoordinate.fromLngLat(centroid, elevation);
    const scaleFactor = mercator.meterInMercatorCoordinateUnits();
    
    const position = new THREE.Vector3(mercator.x, mercator.y, mercator.z);
    
    // Angle calculation based on lot boundary orientation
    let angle = 0;
    const outerRing = Array.isArray(coords[0][0][0]) ? coords[0][0] : coords[0];
    if (outerRing && outerRing.length >= 2) {
      const p1 = maplibregl.MercatorCoordinate.fromLngLat(outerRing[0], 0);
      const p2 = maplibregl.MercatorCoordinate.fromLngLat(outerRing[1], 0);
      angle = -Math.atan2(p2.y - p1.y, p2.x - p1.x) + Math.PI / 2;
    }
    const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, angle));
    const scale = new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor);

    // Style assignment: 0=Classic, 1=Premium, 2=Eco
    const lotId = feat.properties.fid || feat.properties.OBJECTID || 0;
    const style = lotId % 3;

    // Compose lot master matrix
    const lotMatrix = new THREE.Matrix4();
    lotMatrix.compose(position, rotation, scale);

    const subMatrix = new THREE.Matrix4();
    const tempTranslation = new THREE.Vector3();
    const tempRotation = new THREE.Quaternion();
    const tempScale = new THREE.Vector3(1, 1, 1);

    const setSubMesh = (instancedMesh, localPos, localEuler, localScale) => {
      tempTranslation.copy(localPos);
      if (localEuler) {
        tempRotation.setFromEuler(localEuler);
      } else {
        tempRotation.set(0, 0, 0, 1);
      }
      tempScale.copy(localScale || new THREE.Vector3(1, 1, 1));
      subMatrix.compose(tempTranslation, tempRotation, tempScale);
      matrix.multiplyMatrices(lotMatrix, subMatrix);
      instancedMesh.setMatrixAt(lotIdx, matrix);
    };

    // 1. Lawn (always show in 3D)
    setSubMesh(instancedLawn, new THREE.Vector3(0, 0.15 / 2, 0));

    // 2. Driveway (always show in 3D)
    setSubMesh(instancedDriveway, new THREE.Vector3(2.0, 0.06 / 2, 5.0));

    // 3. Build structures based on style
    if (style === 0) {
      // Style 0: Classic Residential House
      setSubMesh(instancedFoundation, new THREE.Vector3(-0.3, 0.3 / 2, -1.0));
      setSubMesh(instancedWallClassic, new THREE.Vector3(-0.3, 0.3 + 4.5 / 2, -1.0));
      setSubMesh(instancedWallAccent, new THREE.Vector3(-0.3, 0.3 + 0.15, -1.0));
      setSubMesh(instancedRoofBase, new THREE.Vector3(-0.3, 0.3 + 4.5 + 0.25 / 2, -1.0));
      setSubMesh(instancedRoofClassic, new THREE.Vector3(-0.3, 0.3 + 4.5 + 0.25 + 1.2, -1.0), new THREE.Euler(Math.PI / 2, 0, 0));
      setSubMesh(instancedDoorClassic, new THREE.Vector3(-1.5, 0.3 + 2.4 / 2, 3.9));
      setSubMesh(instancedDoorFrame, new THREE.Vector3(-1.5, 0.3 + 2.6 / 2, 3.85));
      setSubMesh(instancedWindowClassic, new THREE.Vector3(1.5, 0.3 + 1.8, 3.9));
      setSubMesh(instancedWindowFrame, new THREE.Vector3(1.5, 0.3 + 1.8, 3.85));
    } else if (style === 1) {
      // Style 1: Modern Luxury Villa (with Pool & Solar Panels)
      setSubMesh(instancedFoundation, new THREE.Vector3(-0.3, 0.3 / 2, -1.0));
      setSubMesh(instancedWallPremium, new THREE.Vector3(-0.3, 0.3 + 8.0 / 2, -1.0));
      setSubMesh(instancedWallBase, new THREE.Vector3(-0.3, 0.3 + 0.4 / 2, -1.0));
      setSubMesh(instancedWallCap, new THREE.Vector3(-0.3, 0.3 + 8.0 - 0.25 / 2, -1.0));
      setSubMesh(instancedRoofPremium, new THREE.Vector3(-0.3, 0.3 + 8.0 + 0.5 / 2, -1.0));
      setSubMesh(instancedRoofEdge, new THREE.Vector3(-0.3, 0.3 + 8.0 + 0.5 + 0.2 / 2, -1.0));
      setSubMesh(instancedDoorPremium, new THREE.Vector3(-1.5, 0.3 + 2.6 / 2, 3.9));
      setSubMesh(instancedDoorFramePremium, new THREE.Vector3(-1.5, 0.3 + 2.8 / 2, 3.85));
      setSubMesh(instancedWindowPremium, new THREE.Vector3(1.5, 0.3 + 4.8 / 2, 3.9));
      setSubMesh(instancedWindowFramePremium, new THREE.Vector3(1.5, 0.3 + 4.8 / 2, 3.85));
      
      // Luxury Pool at backyard
      setSubMesh(instancedPoolBorder, new THREE.Vector3(1.5, 0.15 / 2, -5.5));
      setSubMesh(instancedPoolWater, new THREE.Vector3(1.5, 0.12, -5.5));
      setSubMesh(instancedPoolEdge, new THREE.Vector3(1.5, 0.08 / 2, -5.5));

      // Solar Panels on Flat Roof
      setSubMesh(instancedSolarFrame, new THREE.Vector3(-1.5, 0.3 + 8.0 + 0.5 + 0.06, -1.0), new THREE.Euler(-0.25, 0, 0));
      setSubMesh(instancedSolarPanel, new THREE.Vector3(-1.5, 0.3 + 8.0 + 0.5 + 0.12, -1.0), new THREE.Euler(-0.25, 0, 0));
    } else {
      // Style 2: Eco Wooden Cabin (with Solar Panels & Extra Trees)
      setSubMesh(instancedFoundation, new THREE.Vector3(-0.3, 0.3 / 2, -1.0));
      setSubMesh(instancedWallClassic, new THREE.Vector3(-0.3, 0.3 + 4.5 / 2, -1.0));
      setSubMesh(instancedRoofPremium, new THREE.Vector3(-0.3, 0.3 + 4.5 + 0.5 / 2, -1.0));
      setSubMesh(instancedDoorClassic, new THREE.Vector3(-1.5, 0.3 + 2.4 / 2, 3.9));
      setSubMesh(instancedDoorFrame, new THREE.Vector3(-1.5, 0.3 + 2.6 / 2, 3.85));
      setSubMesh(instancedWindowClassic, new THREE.Vector3(1.5, 0.3 + 1.8, 3.9));
      setSubMesh(instancedWindowFrame, new THREE.Vector3(1.5, 0.3 + 1.8, 3.85));

      // Solar Panels on Eco Roof
      setSubMesh(instancedSolarFrame, new THREE.Vector3(-1.5, 0.3 + 4.5 + 0.5 + 0.06, -1.0), new THREE.Euler(-0.25, 0, 0));
      setSubMesh(instancedSolarPanel, new THREE.Vector3(-1.5, 0.3 + 4.5 + 0.5 + 0.12, -1.0), new THREE.Euler(-0.25, 0, 0));
    }

    // 4. Place Vegetation (up to 4 trees and 6 shrubs per lot)
    const setTree = (tIndex, localPos) => {
      // Trunk (Y-cylinder, 3m tall)
      tempTranslation.set(localPos.x, localPos.y + 1.5, localPos.z);
      tempRotation.set(0, 0, 0, 1);
      tempScale.set(1, 1, 1);
      subMatrix.compose(tempTranslation, tempRotation, tempScale);
      matrix.multiplyMatrices(lotMatrix, subMatrix);
      instancedTrunk.setMatrixAt(tIndex, matrix);

      // Foliage (Sphere at top)
      tempTranslation.set(localPos.x, localPos.y + 3.0, localPos.z);
      subMatrix.compose(tempTranslation, tempRotation, tempScale);
      matrix.multiplyMatrices(lotMatrix, subMatrix);
      instancedFoliage.setMatrixAt(tIndex, matrix);
    };

    const setFoliageLow = (flIndex, localPos) => {
      tempTranslation.set(localPos.x, localPos.y + 1.0, localPos.z);
      tempRotation.set(0, 0, 0, 1);
      tempScale.set(1, 1, 1);
      subMatrix.compose(tempTranslation, tempRotation, tempScale);
      matrix.multiplyMatrices(lotMatrix, subMatrix);
      instancedFoliageLow.setMatrixAt(flIndex, matrix);
    };

    const setShrub = (sIndex, localPos, isSmall = false) => {
      tempTranslation.set(localPos.x, localPos.y + (isSmall ? 0.25 : 0.35), localPos.z);
      tempRotation.set(0, 0, 0, 1);
      tempScale.set(1, 1, 1);
      subMatrix.compose(tempTranslation, tempRotation, tempScale);
      matrix.multiplyMatrices(lotMatrix, subMatrix);
      if (isSmall) {
        instancedShrubSmall.setMatrixAt(sIndex, matrix);
      } else {
        instancedShrub.setMatrixAt(sIndex, matrix);
      }
    };

    // Calculate unique indices for vegetation to avoid overlaps
    const baseTreeIdx = lotIdx * 4;
    setTree(baseTreeIdx + 0, new THREE.Vector3(-3.4, 0, 6.5));
    setTree(baseTreeIdx + 1, new THREE.Vector3(-3.4, 0, -6.5));
    setTree(baseTreeIdx + 2, new THREE.Vector3(3.4, 0, -6.5));
    if (style === 2) {
      // Eco gets an extra tree
      setTree(baseTreeIdx + 3, new THREE.Vector3(3.4, 0, 2.0));
    } else {
      instancedTrunk.setMatrixAt(baseTreeIdx + 3, zeroMatrix);
      instancedFoliage.setMatrixAt(baseTreeIdx + 3, zeroMatrix);
    }

    const baseFoliageLowIdx = lotIdx * 2;
    setFoliageLow(baseFoliageLowIdx + 0, new THREE.Vector3(-3.4, 0, 0));
    if (style === 2) {
      setFoliageLow(baseFoliageLowIdx + 1, new THREE.Vector3(3.4, 0, -2.0));
    } else {
      instancedFoliageLow.setMatrixAt(baseFoliageLowIdx + 1, zeroMatrix);
    }

    // Border shrubs forming front hedge
    const baseShrubIdx = lotIdx * 6;
    setShrub(baseShrubIdx + 0, new THREE.Vector3(-2.0, 0, 7.0));
    setShrub(baseShrubIdx + 1, new THREE.Vector3(-1.0, 0, 7.0));
    setShrub(baseShrubIdx + 2, new THREE.Vector3(0.0, 0, 7.0));
    setShrub(baseShrubIdx + 3, new THREE.Vector3(1.0, 0, 7.0));
    setShrub(baseShrubIdx + 4, new THREE.Vector3(2.0, 0, 7.0));
    setShrub(baseShrubIdx + 5, new THREE.Vector3(3.0, 0, 7.0));

    // Entry path small shrubs
    const baseShrubSmallIdx = lotIdx * 4;
    setShrub(baseShrubSmallIdx + 0, new THREE.Vector3(0.8, 0, 5.0), true);
    setShrub(baseShrubSmallIdx + 1, new THREE.Vector3(0.8, 0, 3.5), true);
    setShrub(baseShrubSmallIdx + 2, new THREE.Vector3(3.2, 0, 5.0), true);
    setShrub(baseShrubSmallIdx + 3, new THREE.Vector3(3.2, 0, 3.5), true);
  });

  // 6. Position Streetlights - Enhanced detail
  streetlightPoints.forEach((slPoint, slIdx) => {
    const scaleFactor = slPoint.meterScale;
    const position = slPoint.position;
    const scale = new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor);

    const facingAngle = slPoint.rotationAngle + (slPoint.leftSide ? -Math.PI/2 : Math.PI/2);
    const slRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, facingAngle));

    // A. Base plate
    const basePos = new THREE.Vector3(0, 0, 0.15).applyQuaternion(slRotation).multiplyScalar(scaleFactor).add(position);
    matrix.compose(basePos, slRotation, scale);
    instancedSlBase.setMatrixAt(slIdx, matrix);

    // B. Pole (taller, 5.5m)
    const polePos = new THREE.Vector3(0, 0, 2.75).applyQuaternion(slRotation).multiplyScalar(scaleFactor).add(position);
    matrix.compose(polePos, slRotation, scale);
    instancedSlPole.setMatrixAt(slIdx, matrix);

    // C. Arm joint at top
    const jointPos = new THREE.Vector3(0, 0, 5.5).applyQuaternion(slRotation).multiplyScalar(scaleFactor).add(position);
    matrix.compose(jointPos, slRotation, scale);
    instancedSlArmJoint.setMatrixAt(slIdx, matrix);

    // D. Arm (extends outwards from top of pole)
    const armPos = new THREE.Vector3(0, 0.6, 5.5).applyQuaternion(slRotation).multiplyScalar(scaleFactor).add(position);
    const armRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, facingAngle));
    matrix.compose(armPos, armRot, scale);
    instancedSlArm.setMatrixAt(slIdx, matrix);

    // E. Reflector housing
    const reflectorPos = new THREE.Vector3(0, 1.2, 5.4).applyQuaternion(slRotation).multiplyScalar(scaleFactor).add(position);
    matrix.compose(reflectorPos, slRotation, scale);
    instancedSlReflector.setMatrixAt(slIdx, matrix);

    // F. Bulb (at the end of the arm, pointing downwards)
    const bulbPos = new THREE.Vector3(0, 1.4, 5.2).applyQuaternion(slRotation).multiplyScalar(scaleFactor).add(position);
    matrix.compose(bulbPos, slRotation, scale);
    instancedSlBulb.setMatrixAt(slIdx, matrix);
  });

  // 7. Update bounds/matrices
  instancedLawn.instanceMatrix.needsUpdate = true;
  instancedDriveway.instanceMatrix.needsUpdate = true;
  instancedFoundation.instanceMatrix.needsUpdate = true;
  instancedWallClassic.instanceMatrix.needsUpdate = true;
  instancedWallAccent.instanceMatrix.needsUpdate = true;
  instancedRoofBase.instanceMatrix.needsUpdate = true;
  instancedRoofClassic.instanceMatrix.needsUpdate = true;
  instancedRoofOverhang.instanceMatrix.needsUpdate = true;
  instancedDoorClassic.instanceMatrix.needsUpdate = true;
  instancedDoorFrame.instanceMatrix.needsUpdate = true;
  instancedWindowClassic.instanceMatrix.needsUpdate = true;
  instancedWindowFrame.instanceMatrix.needsUpdate = true;
  instancedWallPremium.instanceMatrix.needsUpdate = true;
  instancedWallBase.instanceMatrix.needsUpdate = true;
  instancedWallCap.instanceMatrix.needsUpdate = true;
  instancedRoofPremium.instanceMatrix.needsUpdate = true;
  instancedRoofEdge.instanceMatrix.needsUpdate = true;
  instancedDoorPremium.instanceMatrix.needsUpdate = true;
  instancedDoorFramePremium.instanceMatrix.needsUpdate = true;
  instancedWindowPremium.instanceMatrix.needsUpdate = true;
  instancedWindowFramePremium.instanceMatrix.needsUpdate = true;
  instancedPoolBorder.instanceMatrix.needsUpdate = true;
  instancedPoolEdge.instanceMatrix.needsUpdate = true;
  instancedPoolWater.instanceMatrix.needsUpdate = true;
  instancedSolarPanel.instanceMatrix.needsUpdate = true;
  instancedSolarFrame.instanceMatrix.needsUpdate = true;
  instancedTrunk.instanceMatrix.needsUpdate = true;
  instancedFoliage.instanceMatrix.needsUpdate = true;
  instancedFoliageLow.instanceMatrix.needsUpdate = true;
  instancedShrub.instanceMatrix.needsUpdate = true;
  instancedShrubSmall.instanceMatrix.needsUpdate = true;
  
  if (slCount > 0) {
    instancedSlPole.instanceMatrix.needsUpdate = true;
    instancedSlBase.instanceMatrix.needsUpdate = true;
    instancedSlArm.instanceMatrix.needsUpdate = true;
    instancedSlArmJoint.instanceMatrix.needsUpdate = true;
    instancedSlBulb.instanceMatrix.needsUpdate = true;
    instancedSlReflector.instanceMatrix.needsUpdate = true;
  }

  // 8. Add to Scene
  scene.add(instancedLawn);
  scene.add(instancedDriveway);
  scene.add(instancedFoundation);
  scene.add(instancedWallClassic);
  scene.add(instancedWallAccent);
  scene.add(instancedRoofBase);
  scene.add(instancedRoofClassic);
  scene.add(instancedRoofOverhang);
  scene.add(instancedDoorClassic);
  scene.add(instancedDoorFrame);
  scene.add(instancedWindowClassic);
  scene.add(instancedWindowFrame);
  scene.add(instancedWallPremium);
  scene.add(instancedWallBase);
  scene.add(instancedWallCap);
  scene.add(instancedRoofPremium);
  scene.add(instancedRoofEdge);
  scene.add(instancedDoorPremium);
  scene.add(instancedDoorFramePremium);
  scene.add(instancedWindowPremium);
  scene.add(instancedWindowFramePremium);
  scene.add(instancedPoolBorder);
  scene.add(instancedPoolEdge);
  scene.add(instancedPoolWater);
  scene.add(instancedSolarPanel);
  scene.add(instancedSolarFrame);
  scene.add(instancedTrunk);
  scene.add(instancedFoliage);
  scene.add(instancedFoliageLow);
  scene.add(instancedShrub);
  scene.add(instancedShrubSmall);
  
  if (slCount > 0) {
    scene.add(instancedSlPole);
    scene.add(instancedSlBase);
    scene.add(instancedSlArm);
    scene.add(instancedSlArmJoint);
    scene.add(instancedSlBulb);
    scene.add(instancedSlReflector);
  }

  // Return helper to dynamically change lights & clean up resources
  return {
    toggle3DMode: (show3D) => {
      const visibility = !!show3D;
      instancedLawn.visible = visibility;
      instancedDriveway.visible = visibility;
      instancedFoundation.visible = visibility;
      instancedWallClassic.visible = visibility;
      instancedWallAccent.visible = visibility;
      instancedRoofBase.visible = visibility;
      instancedRoofClassic.visible = visibility;
      instancedRoofOverhang.visible = visibility;
      instancedDoorClassic.visible = visibility;
      instancedDoorFrame.visible = visibility;
      instancedWindowClassic.visible = visibility;
      instancedWindowFrame.visible = visibility;
      instancedWallPremium.visible = visibility;
      instancedWallBase.visible = visibility;
      instancedWallCap.visible = visibility;
      instancedRoofPremium.visible = visibility;
      instancedRoofEdge.visible = visibility;
      instancedDoorPremium.visible = visibility;
      instancedDoorFramePremium.visible = visibility;
      instancedWindowPremium.visible = visibility;
      instancedWindowFramePremium.visible = visibility;
      instancedPoolBorder.visible = visibility;
      instancedPoolEdge.visible = visibility;
      instancedPoolWater.visible = visibility;
      instancedSolarPanel.visible = visibility;
      instancedSolarFrame.visible = visibility;
      instancedTrunk.visible = visibility;
      instancedFoliage.visible = visibility;
      instancedFoliageLow.visible = visibility;
      instancedShrub.visible = visibility;
      instancedShrubSmall.visible = visibility;
      if (slCount > 0) {
        instancedSlPole.visible = visibility;
        instancedSlBase.visible = visibility;
        instancedSlArm.visible = visibility;
        instancedSlArmJoint.visible = visibility;
        instancedSlBulb.visible = visibility;
        instancedSlReflector.visible = visibility;
      }
    },
    updateLightMode: (timeOfDay) => {
      // House windows emission
      if (timeOfDay === 'night') {
        glassMat.emissive.setHex(0xfde047);
        glassMat.emissiveIntensity = 1.5;
        glassMat.clearcoat = 0.5;
      } else if (timeOfDay === 'sunrise' || timeOfDay === 'sunset') {
        glassMat.emissive.setHex(0xfef08a); 
        glassMat.emissiveIntensity = 0.8;
        glassMat.clearcoat = 0.8;
      } else {
        glassMat.emissive.setHex(0x000000); 
        glassMat.emissiveIntensity = 0.0;
        glassMat.clearcoat = 1.0;
      }
      glassMat.needsUpdate = true;

      // Pool water reflection adjustment
      if (timeOfDay === 'night') {
        poolWaterMat.color.setHex(0x1e3a5f);
        poolWaterMat.transmission = 0.5;
      } else if (timeOfDay === 'sunrise' || timeOfDay === 'sunset') {
        poolWaterMat.color.setHex(0x0ea5e9);
        poolWaterMat.transmission = 0.7;
      } else {
        poolWaterMat.color.setHex(0x0ea5e9);
        poolWaterMat.transmission = 0.9;
      }
      poolWaterMat.needsUpdate = true;

      // Streetlight bulbs emission
      if (timeOfDay === 'night') {
        slBulbMat.color.setHex(0xfffed7);
        slBulbMat.emissive.setHex(0xfef08a);
        slBulbMat.emissiveIntensity = 3.0;
        slReflectorMat.emissive.setHex(0xfef08a);
        slReflectorMat.emissiveIntensity = 2.5;
      } else if (timeOfDay === 'sunset' || timeOfDay === 'sunrise') {
        slBulbMat.color.setHex(0xffecc8);
        slBulbMat.emissive.setHex(0xf59e0b); 
        slBulbMat.emissiveIntensity = 1.0;
        slReflectorMat.emissive.setHex(0xf59e0b);
        slReflectorMat.emissiveIntensity = 0.8;
      } else {
        slBulbMat.color.setHex(0xffffff);
        slBulbMat.emissive.setHex(0x000000); 
        slBulbMat.emissiveIntensity = 0.0;
        slReflectorMat.emissive.setHex(0x000000);
        slReflectorMat.emissiveIntensity = 0.0;
      }
      slBulbMat.needsUpdate = true;
      slReflectorMat.needsUpdate = true;
    },
    dispose: () => {
      // Remove from scene
      scene.remove(instancedLawn);
      scene.remove(instancedDriveway);
      scene.remove(instancedFoundation);
      scene.remove(instancedWallClassic);
      scene.remove(instancedWallAccent);
      scene.remove(instancedRoofBase);
      scene.remove(instancedRoofClassic);
      scene.remove(instancedRoofOverhang);
      scene.remove(instancedDoorClassic);
      scene.remove(instancedDoorFrame);
      scene.remove(instancedWindowClassic);
      scene.remove(instancedWindowFrame);
      scene.remove(instancedWallPremium);
      scene.remove(instancedWallBase);
      scene.remove(instancedWallCap);
      scene.remove(instancedRoofPremium);
      scene.remove(instancedRoofEdge);
      scene.remove(instancedDoorPremium);
      scene.remove(instancedDoorFramePremium);
      scene.remove(instancedWindowPremium);
      scene.remove(instancedWindowFramePremium);
      scene.remove(instancedPoolBorder);
      scene.remove(instancedPoolEdge);
      scene.remove(instancedPoolWater);
      scene.remove(instancedSolarPanel);
      scene.remove(instancedSolarFrame);
      scene.remove(instancedTrunk);
      scene.remove(instancedFoliage);
      scene.remove(instancedFoliageLow);
      scene.remove(instancedShrub);
      scene.remove(instancedShrubSmall);
      if (slCount > 0) {
        scene.remove(instancedSlPole);
        scene.remove(instancedSlBase);
        scene.remove(instancedSlArm);
        scene.remove(instancedSlArmJoint);
        scene.remove(instancedSlBulb);
        scene.remove(instancedSlReflector);
      }

      // Dispose geometries
      lawnGeom.dispose();
      drivewayGeom.dispose();
      foundationGeom.dispose();
      wallClassicGeom.dispose();
      wallAccentGeom.dispose();
      roofBaseGeom.dispose();
      roofClassicGeom.dispose();
      roofOverhangGeom.dispose();
      doorClassicGeom.dispose();
      doorFrameGeom.dispose();
      windowClassicGeom.dispose();
      windowFrameGeom.dispose();
      wallPremiumGeom.dispose();
      wallBaseGeom.dispose();
      wallCapGeom.dispose();
      roofPremiumGeom.dispose();
      roofEdgeGeom.dispose();
      doorPremiumGeom.dispose();
      doorFramePremiumGeom.dispose();
      windowPremiumGeom.dispose();
      windowFramePremiumGeom.dispose();
      poolBorderGeom.dispose();
      poolEdgeGeom.dispose();
      poolWaterGeom.dispose();
      solarPanelGeom.dispose();
      solarFrameGeom.dispose();
      trunkGeom.dispose();
      foliageGeom.dispose();
      foliageLowGeom.dispose();
      shrubGeom.dispose();
      shrubSmallGeom.dispose();
      slPoleGeom.dispose();
      slBaseGeom.dispose();
      slArmGeom.dispose();
      slArmJointGeom.dispose();
      slBulbGeom.dispose();
      slReflectorGeom.dispose();

      // Dispose materials
      lawnMat.dispose();
      drivewayMat.dispose();
      foundationMat.dispose();
      wallClassicMat.dispose();
      wallAccentMat.dispose();
      roofBaseMat.dispose();
      roofClassicMat.dispose();
      roofOverhangMat.dispose();
      doorClassicMat.dispose();
      doorFrameMat.dispose();
      windowClassicMat.dispose();
      windowFrameMat.dispose();
      wallPremiumMat.dispose();
      wallBaseMat.dispose();
      wallCapMat.dispose();
      roofPremiumMat.dispose();
      roofEdgeMat.dispose();
      doorPremiumMat.dispose();
      doorFramePremiumMat.dispose();
      windowPremiumMat.dispose();
      windowFramePremiumMat.dispose();
      poolBorderMat.dispose();
      poolEdgeMat.dispose();
      poolWaterMat.dispose();
      solarPanelMat.dispose();
      solarFrameMat.dispose();
      glassMat.dispose();
      glassMatEmissive.dispose();
      trunkMat.dispose();
      foliageMat.dispose();
      foliageLowMat.dispose();
      fruitFoliageMat.dispose();
      slMetalMat.dispose();
      slBulbMat.dispose();
      slReflectorMat.dispose();
    }
  };
};

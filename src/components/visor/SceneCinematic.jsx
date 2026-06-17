/**
 * SceneCinematic.jsx
 * 
 * Full-screen React Three Fiber canvas with cinematic lighting,
 * HDRI environment, volumetric fog, and post-processing effects.
 * Adaptive quality: disables DOF on mobile to maintain 60 FPS.
 */
import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import { Environment, OrbitControls } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  DepthOfField,
} from '@react-three/postprocessing';

/* ── Detect mobile for adaptive quality ── */
const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent);

/* ── Three-point cinematic lighting ── */
function CinematicLights() {
  return (
    <>
      {/* Ambient base */}
      <ambientLight intensity={0.4} />

      {/* Key light — warm sun from top-right */}
      <directionalLight
        position={[40, 60, 20]}
        intensity={2.2}
        color="#FFF8E7"
        castShadow
        shadow-mapSize-width={isMobile ? 1024 : 2048}
        shadow-mapSize-height={isMobile ? 1024 : 2048}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-bias={-0.0001}
      />

      {/* Fill light — cool tone from opposite side */}
      <directionalLight
        position={[-30, 40, -30]}
        intensity={0.7}
        color="#E8F4F8"
      />

      {/* Rim / back light — warm kick */}
      <pointLight
        position={[0, 25, -40]}
        intensity={1.0}
        color="#FFF8E7"
      />
    </>
  );
}

/* ── Post-processing stack ── */
function CinematicEffects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Noise opacity={0.035} />
      <Vignette darkness={0.35} offset={0.12} />
      {/* DOF only on desktop — too expensive for mobile */}
      {!isMobile && (
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.04}
          bokehScale={1.5}
        />
      )}
    </EffectComposer>
  );
}

/**
 * SceneCinematic — wraps children in a fully configured R3F Canvas
 * with cinematic environment, lighting and effects.
 * @param {{ children: React.ReactNode }} props
 */
export default function SceneCinematic({ children }) {
  return (
    <Canvas
      shadows
      camera={{
        position: [60, 30, 60],
        fov: 35,
        near: 0.1,
        far: 2000,
      }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
      }}
      dpr={isMobile ? [1, 1.2] : [1, 1.8]}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {/* Sky background colour (warm cream) */}
      <color attach="background" args={['#F8F5F0']} />

      {/* HDRI environment — sunset preset for warm golden tones */}
      <Suspense fallback={null}>
        <Environment preset="sunset" background />
      </Suspense>

      {/* Volumetric fog — depth cue */}
      <fog attach="fog" color="#F8F5F0" near={30} far={220} />

      <CinematicLights />

      {/* Scene content */}
      <Suspense fallback={null}>
        {children}
      </Suspense>

      {/* Orbit controls for manual exploration */}
      <OrbitControls
        enablePan={false}
        maxDistance={200}
        minDistance={20}
        maxPolarAngle={Math.PI / 2.1}
        target={[3, 0, 0]}
      />

      <CinematicEffects />
    </Canvas>
  );
}

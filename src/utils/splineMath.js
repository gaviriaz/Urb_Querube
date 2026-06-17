// Catmull-Rom spline helper
export const catmullRom = (p0, p1, p2, p3, t) => {
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
  );
};

// Angle linear interpolation with wrap-around handling
export const lerpAngle = (a, b, t) => {
  let diff = b - a;
  while (diff < -180) diff += 360;
  while (diff > 180) diff -= 360;
  return a + diff * t;
};

// Hermite smoothstep: smooth ease-in/ease-out [0,1] → [0,1]
export const smoothstep = (t) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};

// Ken Perlin's smoother step (C2 continuous, no acceleration jumps)
export const smootherstep = (t) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// Inverse lerp: maps a value from [a,b] → [0,1]
export const inverseLerp = (a, b, value) => {
  if (Math.abs(b - a) < 1e-10) return 0;
  return (value - a) / (b - a);
};

// Linear interpolation
export const lerp = (a, b, t) => a + (b - a) * t;

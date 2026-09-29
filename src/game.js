// Pure rules shared by the renderer and UI. Volumes are in millilitres.
export const CAPACITY = 250;
export const FLOW_ML_PER_SECOND = 25;
export const MARK_FRACTIONS = [0.25, 0.5, 0.75];

export const VESSELS = [
  { id: 'straight', name: 'VASO RECTO', color: '#7ad9d1', radius: (t) => 0.57 + 0.012 * Math.sin(t * Math.PI) },
  { id: 'wide-bottom', name: 'ANCHO ABAJO', color: '#76c9c7', radius: (t) => 0.70 - 0.24 * t + 0.015 * Math.sin(t * Math.PI) },
  { id: 'wide-top', name: 'ANCHO ARRIBA', color: '#80dcd1', radius: (t) => 0.45 + 0.25 * t + 0.012 * Math.sin(t * Math.PI) },
];

// Numerical integration: the exact same radius function defines glass,
// fill surface and the volume-to-height conversion.
export function makeVolumeTable(vessel, steps = 256) {
  const cumulative = new Float64Array(steps + 1);
  for (let i = 1; i <= steps; i += 1) {
    const low = vessel.radius((i - 1) / steps);
    const high = vessel.radius(i / steps);
    cumulative[i] = cumulative[i - 1] + Math.PI * (low * low + high * high) / (2 * steps);
  }
  return { cumulative, total: cumulative[steps], steps };
}

export function heightForVolume(volume, table) {
  const wanted = Math.max(0, Math.min(CAPACITY, volume)) / CAPACITY * table.total;
  let lo = 0;
  let hi = table.steps;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (table.cumulative[mid] < wanted) lo = mid + 1;
    else hi = mid;
  }
  if (lo === 0) return 0;
  const a = table.cumulative[lo - 1];
  const b = table.cumulative[lo];
  return ((lo - 1) + (b > a ? (wanted - a) / (b - a) : 0)) / table.steps;
}

export function resultFor(actual, target) {
  const difference = Math.abs(actual - target);
  return {
    difference,
    grade: difference < 1 ? 'exact' : difference <= 5 ? 'close' : 'miss',
    direction: actual < target ? 'short' : actual > target ? 'over' : 'equal',
  };
}

const TARGETS = Array.from({ length: 23 }, (_, i) => 90 + i * 5);
export function chooseRound(previous, random = Math.random) {
  let choice;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    choice = {
      vessel: VESSELS[Math.min(VESSELS.length - 1, Math.floor(random() * VESSELS.length))],
      target: TARGETS[Math.min(TARGETS.length - 1, Math.floor(random() * TARGETS.length))],
    };
    if (!previous || choice.vessel.id !== previous.vessel.id || choice.target !== previous.target) return choice;
  }
  // Also terminate with deterministic random sources (useful for reproducible tests).
  return { vessel: VESSELS[(VESSELS.indexOf(choice.vessel) + 1) % VESSELS.length], target: choice.target };
}

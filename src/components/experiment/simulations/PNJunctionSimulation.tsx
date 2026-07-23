import React, { useEffect, useMemo, useState } from 'react';

type BiasScene = 'forward' | 'reverse';

type Particle = {
  id: string;
  kind: 'electron' | 'hole';
  lane: number;
  delay: number;
  size: number;
  opacity: number;
};

const COLORS = {
  background: '#f8fafc',
  panel: '#ffffff',
  grid: '#e5e7eb',
  pSide: '#dbeafe',
  nSide: '#fee2e2',
  depletion: '#eef2ff',
  depletionEdge: '#94a3b8',
  electron: '#2563eb',
  hole: '#f97316',
  text: '#0f172a',
  muted: '#475569',
  dim: '#94a3b8',
  majorityArrow: '#1d4ed8',
  minorityArrow: '#94a3b8',
};

const ELECTRON_MAJOR = [
  { x1: 750, x2: 505, y: 182 },
  { x1: 785, x2: 515, y: 220 },
  { x1: 730, x2: 500, y: 258 },
];

const HOLE_MAJOR = [
  { x1: 250, x2: 495, y: 182 },
  { x1: 215, x2: 485, y: 220 },
  { x1: 270, x2: 500, y: 258 },
];

const ELECTRON_MINOR_FORWARD = [
  { x1: 320, x2: 610, y: 154 },
  { x1: 290, x2: 585, y: 292 },
];

const HOLE_MINOR_FORWARD = [
  { x1: 690, x2: 410, y: 154 },
  { x1: 710, x2: 425, y: 292 },
];

const ELECTRON_MAJOR_REVERSE = [
  { x1: 560, x2: 780, y: 178 },
  { x1: 575, x2: 815, y: 220 },
  { x1: 545, x2: 760, y: 262 },
];

const HOLE_MAJOR_REVERSE = [
  { x1: 440, x2: 220, y: 178 },
  { x1: 425, x2: 190, y: 220 },
  { x1: 455, x2: 240, y: 262 },
];

const ELECTRON_MINOR_REVERSE = [
  { x1: 330, x2: 610, y: 150 },
  { x1: 360, x2: 625, y: 294 },
];

const HOLE_MINOR_REVERSE = [
  { x1: 675, x2: 395, y: 150 },
  { x1: 645, x2: 380, y: 294 },
];

const makeParticles = (scene: BiasScene): Particle[] => {
  const particles: Particle[] = [];

  const electronMajor = scene === 'forward' ? ELECTRON_MAJOR : ELECTRON_MAJOR_REVERSE;
  const holeMajor = scene === 'forward' ? HOLE_MAJOR : HOLE_MAJOR_REVERSE;
  const electronMinor = scene === 'forward' ? ELECTRON_MINOR_FORWARD : ELECTRON_MINOR_REVERSE;
  const holeMinor = scene === 'forward' ? HOLE_MINOR_FORWARD : HOLE_MINOR_REVERSE;

  electronMajor.forEach((_, index) => {
    particles.push({
      id: `e-major-${index}`,
      kind: 'electron',
      lane: index,
      delay: index * 0.12,
      size: 8,
      opacity: 1,
    });
  });

  holeMajor.forEach((_, index) => {
    particles.push({
      id: `h-major-${index}`,
      kind: 'hole',
      lane: index,
      delay: index * 0.12 + 0.05,
      size: 8,
      opacity: 1,
    });
  });

  electronMinor.forEach((_, index) => {
    particles.push({
      id: `e-minor-${index}`,
      kind: 'electron',
      lane: index,
      delay: 0.18 + index * 0.14,
      size: 5,
      opacity: 0.48,
    });
  });

  holeMinor.forEach((_, index) => {
    particles.push({
      id: `h-minor-${index}`,
      kind: 'hole',
      lane: index,
      delay: 0.24 + index * 0.14,
      size: 5,
      opacity: 0.48,
    });
  });

  return particles;
};

const cycle = (value: number) => value - Math.floor(value);

const pathPoint = (x1: number, x2: number, y: number, progress: number) => {
  const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
  return {
    x: x1 + (x2 - x1) * eased,
    y,
  };
};

const Arrow = ({
  x1,
  x2,
  y,
  color,
  opacity,
  strokeWidth = 2,
}: {
  x1: number;
  x2: number;
  y: number;
  color: string;
  opacity: number;
  strokeWidth?: number;
}) => {
  const headX = x2;
  const direction = x2 >= x1 ? 1 : -1;

  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={strokeWidth} />
      <path
        d={`M ${headX} ${y} L ${headX - 10 * direction} ${y - 6} L ${headX - 10 * direction} ${y + 6} Z`}
        fill={color}
      />
    </g>
  );
};

const Carrier = ({
  scene,
  particle,
  progress,
}: {
  scene: BiasScene;
  particle: Particle;
  progress: number;
}) => {
  const major = particle.opacity > 0.9;
  const lanes = scene === 'forward'
    ? {
        electronMajor: ELECTRON_MAJOR,
        holeMajor: HOLE_MAJOR,
        electronMinor: ELECTRON_MINOR_FORWARD,
        holeMinor: HOLE_MINOR_FORWARD,
      }
    : {
        electronMajor: ELECTRON_MAJOR_REVERSE,
        holeMajor: HOLE_MAJOR_REVERSE,
        electronMinor: ELECTRON_MINOR_REVERSE,
        holeMinor: HOLE_MINOR_REVERSE,
      };

  const source =
    particle.kind === 'electron'
      ? major
        ? lanes.electronMajor[particle.lane]
        : lanes.electronMinor[particle.lane]
      : major
        ? lanes.holeMajor[particle.lane]
        : lanes.holeMinor[particle.lane];

  const localProgress = cycle(progress + particle.delay);
  const { x, y } = pathPoint(source.x1, source.x2, source.y, localProgress);
  const fill = particle.kind === 'electron' ? COLORS.electron : COLORS.hole;
  const dimmedFill = particle.kind === 'electron' ? 'rgba(37, 99, 235, 0.35)' : 'rgba(249, 115, 22, 0.35)';
  const label = particle.kind === 'electron' ? '−' : '+';

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={particle.size}
        fill={major ? fill : 'rgba(255, 255, 255, 0.88)'}
        stroke={fill}
        strokeWidth={major ? 2 : 1.2}
        opacity={particle.opacity}
      />
      <text
        x={x}
        y={y + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={particle.size * 1.25}
        fontWeight={700}
        fill={major ? '#ffffff' : dimmedFill}
        opacity={particle.opacity}
      >
        {label}
      </text>
    </g>
  );
};

const PNJunctionBiasAnimation = () => {
  const [scene, setScene] = useState<BiasScene>('forward');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let start = performance.now();
    const duration = 7000;

    const animate = (now: number) => {
      const elapsed = now - start;
      setProgress((elapsed % duration) / duration);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const particles = useMemo(() => makeParticles(scene), [scene]);
  const depletionWidth = scene === 'forward' ? 96 + 8 * Math.sin(progress * Math.PI * 2) : 160 + 10 * Math.sin(progress * Math.PI * 2);
  const centerX = 500;
  const depletionLeft = centerX - depletionWidth / 2;
  const depletionRight = centerX + depletionWidth / 2;

  const narration =
    scene === 'forward'
      ? 'In forward bias, the barrier decreases, allowing majority carriers to cross the junction. Minority carriers move in the opposite direction.'
      : 'In reverse bias, the barrier increases. Majority carriers move away from the junction, while minority carriers drift in the opposite direction.';

  return (
    <div
      style={{
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: COLORS.background,
        color: COLORS.text,
        padding: 24,
        borderRadius: 20,
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.02 * 16 }}>
            PN Junction Bias Animation
          </div>
          <div style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>
            Clean 2D textbook-style view of forward bias and reverse bias
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setScene('forward')}
            style={{
              border: '1px solid #cbd5e1',
              background: scene === 'forward' ? '#dbeafe' : COLORS.panel,
              color: COLORS.text,
              padding: '10px 14px',
              borderRadius: 999,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Forward Bias
          </button>
          <button
            type="button"
            onClick={() => setScene('reverse')}
            style={{
              border: '1px solid #cbd5e1',
              background: scene === 'reverse' ? '#fee2e2' : COLORS.panel,
              color: COLORS.text,
              padding: '10px 14px',
              borderRadius: 999,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reverse Bias
          </button>
        </div>
      </div>

      <div
        style={{
          background: COLORS.panel,
          border: '1px solid #e2e8f0',
          borderRadius: 18,
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        <svg viewBox="0 0 1000 430" width="100%" height="auto" role="img" aria-label="PN junction animation">
          <defs>
            <linearGradient id="pGradient" x1="0" x2="1">
              <stop offset="0%" stopColor={COLORS.pSide} />
              <stop offset="100%" stopColor="#eff6ff" />
            </linearGradient>
            <linearGradient id="nGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#fff1f2" />
              <stop offset="100%" stopColor={COLORS.nSide} />
            </linearGradient>
            <linearGradient id="depletionGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="rgba(96, 165, 250, 0.18)" />
              <stop offset="50%" stopColor={COLORS.depletion} />
              <stop offset="100%" stopColor="rgba(251, 146, 60, 0.18)" />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.12" />
            </filter>
          </defs>

          <rect x="0" y="0" width="1000" height="430" fill={COLORS.background} />
          <rect x="0" y="0" width={depletionLeft} height="430" fill="url(#pGradient)" />
          <rect x={depletionRight} y="0" width={1000 - depletionRight} height="430" fill="url(#nGradient)" />
          <rect x={depletionLeft} y="0" width={depletionWidth} height="430" fill="url(#depletionGradient)" />

          <line x1={depletionLeft} y1="0" x2={depletionLeft} y2="430" stroke={COLORS.depletionEdge} strokeDasharray="7 7" />
          <line x1={depletionRight} y1="0" x2={depletionRight} y2="430" stroke={COLORS.depletionEdge} strokeDasharray="7 7" />

          <text x="36" y="42" fontSize="22" fontWeight="800" fill="#1e3a8a">
            P-side
          </text>
          <text x="904" y="42" fontSize="22" fontWeight="800" fill="#991b1b">
            N-side
          </text>
          <text x={centerX} y="58" textAnchor="middle" fontSize="15" fontWeight="700" fill={COLORS.muted}>
            Depletion region
          </text>

          <g opacity="0.95">
            {scene === 'forward' ? (
              <>
                <Arrow x1={720} x2={540} y={96} color={COLORS.majorityArrow} opacity={0.9} strokeWidth={3} />
                <Arrow x1={280} x2={460} y={122} color={COLORS.majorityArrow} opacity={0.9} strokeWidth={3} />
                <Arrow x1={260} x2={560} y={350} color={COLORS.minorityArrow} opacity={0.45} strokeWidth={2} />
                <Arrow x1={740} x2={440} y={374} color={COLORS.minorityArrow} opacity={0.45} strokeWidth={2} />
              </>
            ) : (
              <>
                <Arrow x1={520} x2={740} y={96} color={COLORS.majorityArrow} opacity={0.82} strokeWidth={3} />
                <Arrow x1={480} x2={260} y={122} color={COLORS.majorityArrow} opacity={0.82} strokeWidth={3} />
                <Arrow x1={300} x2={565} y={350} color={COLORS.minorityArrow} opacity={0.5} strokeWidth={2} />
                <Arrow x1={700} x2={435} y={374} color={COLORS.minorityArrow} opacity={0.5} strokeWidth={2} />
              </>
            )}
          </g>

          <g filter="url(#softShadow)">
            <rect x="414" y="68" width="172" height="42" rx="12" fill="#ffffff" stroke="#cbd5e1" />
            <text x="500" y="95" textAnchor="middle" fontSize="16" fontWeight="700" fill={COLORS.text}>
              Battery
            </text>
            <line x1="500" y1="110" x2="500" y2="150" stroke="#64748b" strokeWidth="3" />
            <line x1="500" y1="282" x2="500" y2="320" stroke="#64748b" strokeWidth="3" />
            <circle cx="500" cy="150" r="12" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
            <circle cx="500" cy="282" r="12" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
            <text x="500" y="154" textAnchor="middle" fontSize="15" fontWeight="900" fill="#0f172a">
              {scene === 'forward' ? '+' : '-'}
            </text>
            <text x="500" y="286" textAnchor="middle" fontSize="15" fontWeight="900" fill="#0f172a">
              {scene === 'forward' ? '-' : '+'}
            </text>
            <text x="360" y="161" fontSize="16" fontWeight="800" fill="#0f172a">
              {scene === 'forward' ? 'P +' : 'P -'}
            </text>
            <text x="520" y="161" fontSize="16" fontWeight="800" fill="#0f172a">
              {scene === 'forward' ? 'N -' : 'N +'}
            </text>
          </g>

          <g>
            <text x="44" y="404" fontSize="16" fontWeight="700" fill="#1e3a8a">
              P-side majority carriers: holes
            </text>
            <text x="44" y="374" fontSize="16" fontWeight="700" fill="#2563eb">
              P-side minority carriers: electrons
            </text>
            <text x="612" y="374" fontSize="16" fontWeight="700" fill="#f97316">
              N-side minority carriers: holes
            </text>
            <text x="612" y="404" fontSize="16" fontWeight="700" fill="#991b1b">
              N-side majority carriers: electrons
            </text>
          </g>

          <g opacity="0.55">
            {Array.from({ length: 9 }).map((_, index) => (
              <circle key={`p-ion-${index}`} cx={52 + index * 40} cy={160 + (index % 2) * 44} r="7" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
            ))}
            {Array.from({ length: 9 }).map((_, index) => (
              <circle key={`n-ion-${index}`} cx={668 + index * 36} cy={160 + (index % 2) * 44} r="7" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" />
            ))}
          </g>

          <g>
            {particles.map(particle => (
              <Carrier key={particle.id} scene={scene} particle={particle} progress={progress} />
            ))}
          </g>

          <g>
            <rect x="26" y="18" width="160" height="28" rx="8" fill="#ffffff" stroke="#dbeafe" />
            <text x="106" y="37" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e3a8a">
              Electrons
            </text>
            <circle cx="220" cy="32" r="8" fill={COLORS.electron} />
            <text x="242" y="37" fontSize="14" fontWeight="700" fill={COLORS.text}>
              Blue
            </text>

            <rect x="330" y="18" width="150" height="28" rx="8" fill="#ffffff" stroke="#fed7aa" />
            <text x="405" y="37" textAnchor="middle" fontSize="14" fontWeight="700" fill="#c2410c">
              Holes
            </text>
            <circle cx="512" cy="32" r="8" fill={COLORS.hole} />
            <text x="534" y="37" fontSize="14" fontWeight="700" fill={COLORS.text}>
              Orange
            </text>

            <rect x="612" y="18" width="168" height="28" rx="8" fill="#ffffff" stroke="#cbd5e1" />
            <text x="696" y="37" textAnchor="middle" fontSize="14" fontWeight="700" fill={COLORS.text}>
              Majority carriers
            </text>
            <rect x="800" y="18" width="166" height="28" rx="8" fill="#ffffff" stroke="#cbd5e1" />
            <text x="883" y="37" textAnchor="middle" fontSize="14" fontWeight="700" fill={COLORS.muted}>
              Minority carriers
            </text>
          </g>
        </svg>

        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            padding: '18px 20px 20px',
            display: 'grid',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              width: 'fit-content',
              borderRadius: 999,
              padding: '8px 12px',
              background: scene === 'forward' ? '#dbeafe' : '#fee2e2',
              fontWeight: 800,
            }}
          >
            {scene === 'forward' ? 'Scene 1: Forward bias' : 'Scene 2: Reverse bias'}
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: COLORS.text,
              lineHeight: 1.6,
              fontSize: 15,
            }}
          >
            {narration}
          </div>

          <div style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.5 }}>
            In forward bias, the depletion region narrows and the reduced barrier allows majority
            carriers to diffuse across the junction. In reverse bias, the depletion region widens
            and the electric field drives minority carriers across while majority carriers are
            pushed away from the junction.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PNJunctionBiasAnimation;

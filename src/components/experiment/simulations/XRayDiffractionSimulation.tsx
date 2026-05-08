import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type CrystalType = 'nacl' | 'diamond';

type Peak = {
  id: string;
  h: number;
  k: number;
  l: number;
  dSpacing: number;
  twoTheta: number;
  theta: number;
  intensity: number;
  multiplicity: number;
  latticeParameter: number;
};

const crystalConfig: Record<
  CrystalType,
  {
    label: string;
    latticeConstant: number;
    description: string;
  }
> = {
  nacl: {
    label: 'NaCl (Rock Salt)',
    latticeConstant: 5.6402,
    description: 'FCC lattice with Na and Cl basis atoms',
  },
  diamond: {
    label: 'Diamond Cubic',
    latticeConstant: 3.567,
    description: 'Diamond cubic crystal structure',
  },
};

const xraySources = {
  'Cu K-alpha': 1.5406,
  'Mo K-alpha': 0.7093,
} as const;

const formatPeakLabel = (peak: Pick<Peak, 'h' | 'k' | 'l'>) => `(${peak.h}${peak.k}${peak.l})`;

const calculateLatticeParameterFromPeak = (
  peak: Pick<Peak, 'h' | 'k' | 'l' | 'twoTheta'>,
  wavelength: number
) => {
  const thetaRadians = (peak.twoTheta * Math.PI) / 360;
  const denominator = 2 * Math.sin(thetaRadians);

  if (denominator <= 0) {
    return 0;
  }

  const dSpacing = wavelength / denominator;
  const gSquared = peak.h * peak.h + peak.k * peak.k + peak.l * peak.l;

  if (gSquared === 0) {
    return 0;
  }

  return dSpacing * Math.sqrt(gSquared);
};

const calculateMultiplicity = (h: number, k: number, l: number) => {
  const nonZero = [h, k, l].filter(value => value !== 0).length;

  if (h === k && k === l) {
    return 8;
  }

  if (h === k || k === l || h === l) {
    return nonZero === 3 ? 24 : 12;
  }

  return nonZero === 3 ? 48 : 24;
};

const getNaClIntensityFactor = (h: number, k: number, l: number) => {
  const sameParity = h % 2 === k % 2 && k % 2 === l % 2;

  if (!sameParity) {
    return 0;
  }

  const fNa = 11;
  const fCl = 17;
  const structureAmplitude = (h + k + l) % 2 === 0 ? fNa + fCl : fCl - fNa;

  return structureAmplitude * structureAmplitude;
};

const getDiamondIntensityFactor = (h: number, k: number, l: number) => {
  const sameParity = h % 2 === k % 2 && k % 2 === l % 2;

  if (!sameParity) {
    return 0;
  }

  const allOdd = h % 2 === 1 && k % 2 === 1 && l % 2 === 1;
  const evenAllowed = h % 2 === 0 && (h + k + l) % 4 === 0;

  if (!allOdd && !evenAllowed) {
    return 0;
  }

  return allOdd ? 64 : 32;
};

const buildDiffractionData = (crystalType: CrystalType, wavelength: number) => {
  const { latticeConstant } = crystalConfig[crystalType];
  const peaks: Peak[] = [];
  const maxIndex = 6;

  for (let h = 0; h <= maxIndex; h += 1) {
    for (let k = 0; k <= maxIndex; k += 1) {
      for (let l = 0; l <= maxIndex; l += 1) {
        if (h === 0 && k === 0 && l === 0) {
          continue;
        }

        const gSquared = h * h + k * k + l * l;
        const dSpacing = latticeConstant / Math.sqrt(gSquared);
        const sinTheta = wavelength / (2 * dSpacing);

        if (sinTheta <= 0 || sinTheta > 1) {
          continue;
        }

        const theta = Math.asin(sinTheta);
        const twoTheta = (2 * theta * 180) / Math.PI;
        const multiplicity = calculateMultiplicity(h, k, l);

        const structureFactor =
          crystalType === 'nacl'
            ? getNaClIntensityFactor(h, k, l)
            : getDiamondIntensityFactor(h, k, l);

        if (structureFactor === 0) {
          continue;
        }

        const lorentzLikeWeight = 1 / Math.max(Math.sin(theta) * Math.sin(2 * theta), 0.08);
        const rawIntensity = structureFactor * multiplicity * lorentzLikeWeight;

        peaks.push({
          id: `${h}${k}${l}`,
          h,
          k,
          l,
          dSpacing,
          twoTheta,
          theta: (theta * 180) / Math.PI,
          intensity: rawIntensity,
          multiplicity,
          latticeParameter: 0,
        });
      }
    }
  }

  const mergedPeaks = new Map<string, Peak>();

  for (const peak of peaks) {
    const key = peak.twoTheta.toFixed(2);
    const existing = mergedPeaks.get(key);

    if (!existing || peak.intensity > existing.intensity) {
      mergedPeaks.set(key, peak);
    }
  }

  const normalized = Array.from(mergedPeaks.values()).sort((a, b) => a.twoTheta - b.twoTheta);
  const maxIntensity = Math.max(...normalized.map(peak => peak.intensity), 1);

  return normalized.map(peak => {
    const roundedPeak = {
      ...peak,
      dSpacing: Number(peak.dSpacing.toFixed(4)),
      twoTheta: Number(peak.twoTheta.toFixed(2)),
      theta: Number(peak.theta.toFixed(2)),
      intensity: Number(((peak.intensity / maxIntensity) * 100).toFixed(1)),
      latticeParameter: 0,
    };

    return {
      ...roundedPeak,
      latticeParameter: Number(
        calculateLatticeParameterFromPeak(roundedPeak, wavelength).toFixed(4)
      ),
    };
  });
};

const XRayDiffractionSimulation = () => {
  const [crystalType, setCrystalType] = useState<CrystalType>('nacl');
  const [source, setSource] = useState<keyof typeof xraySources>('Cu K-alpha');

  const wavelength = xraySources[source];

  const diffractionData = useMemo(
    () => buildDiffractionData(crystalType, wavelength),
    [crystalType, wavelength]
  );

  const [selectedPeakId, setSelectedPeakId] = useState<string | null>(null);

  const selectedPeak =
    diffractionData.find(peak => peak.id === selectedPeakId) ?? diffractionData[0] ?? null;

  const selectedLatticeParameter = selectedPeak
    ? calculateLatticeParameterFromPeak(selectedPeak, wavelength)
    : 0;
  const actualLatticeConstant = crystalConfig[crystalType].latticeConstant;
  const percentError =
    selectedPeak && actualLatticeConstant > 0
      ? ((selectedLatticeParameter - actualLatticeConstant) / actualLatticeConstant) * 100
      : 0;

  const exportData = () => {
    const csvContent = [
      [
        'h',
        'k',
        'l',
        'd-spacing (A)',
        'theta (degrees)',
        '2-theta (degrees)',
        'relative intensity',
        'calculated lattice parameter (A)',
      ],
      ...diffractionData.map(peak => [
        peak.h,
        peak.k,
        peak.l,
        peak.dSpacing,
        peak.theta,
        peak.twoTheta,
        peak.intensity,
        peak.latticeParameter,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${crystalType}_xrd_pattern.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const chartWidth = 900;
  const chartHeight = 360;
  const padding = { top: 24, right: 24, bottom: 42, left: 56 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const maxTwoTheta = Math.max(...diffractionData.map(peak => peak.twoTheta), 90);

  const getX = (value: number) => padding.left + (value / maxTwoTheta) * plotWidth;
  const getY = (value: number) => padding.top + plotHeight - (value / 100) * plotHeight;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900">
          X-Ray Diffraction Pattern and Lattice Parameter
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Select a peak from the XRD graph or table to calculate the lattice parameter from that
          reflection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-base font-medium text-slate-900">Experiment Setup</h4>

          <div className="mt-4 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Crystal</label>
              <Select
                value={crystalType}
                onValueChange={value => {
                  setCrystalType(value as CrystalType);
                  setSelectedPeakId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select crystal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nacl">NaCl (Cubic)</SelectItem>
                  <SelectItem value="diamond">Diamond Cubic</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">{crystalConfig[crystalType].description}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">X-ray Source</label>
              <Select
                value={source}
                onValueChange={value => setSource(value as keyof typeof xraySources)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select X-ray source" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(xraySources).map(([name, lambda]) => (
                    <SelectItem key={name} value={name}>
                      {name} ({lambda} A)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Reference Values</div>
              <div className="mt-2 text-sm text-slate-700">Wavelength: {wavelength} A</div>
              <div className="text-sm text-slate-700">
                Actual lattice parameter: {actualLatticeConstant} A
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <div className="text-xs uppercase tracking-wide text-blue-700">Selected Peak Result</div>
              {selectedPeak ? (
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <div>Peak: {formatPeakLabel(selectedPeak)}</div>
                  <div>2-theta: {selectedPeak.twoTheta} deg</div>
                  <div>d-spacing: {selectedPeak.dSpacing} A</div>
                  <div className="pt-1 text-lg font-semibold text-blue-700">
                    a = {selectedLatticeParameter.toFixed(4)} A
                  </div>
                  <div className="text-xs text-slate-500">
                    Error: {Math.abs(selectedLatticeParameter - actualLatticeConstant).toFixed(4)} A (
                    {Math.abs(percentError).toFixed(2)}%)
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-600">Select a peak to view the result.</div>
              )}
            </div>

            <Button onClick={exportData} variant="outline" className="w-full">
              Export Pattern Data
            </Button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-medium text-slate-900">2D XRD Pattern</h4>
                <p className="text-sm text-slate-500">
                  Click any diffraction peak to highlight it and calculate the lattice parameter.
                </p>
              </div>
              {selectedPeak && (
                <div className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700">
                  Selected {formatPeakLabel(selectedPeak)}
                </div>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="min-w-[720px] w-full rounded-lg border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]"
                role="img"
                aria-label="Interactive X-ray diffraction pattern"
              >
                {Array.from({ length: 6 }).map((_, index) => {
                  const value = index * 20;
                  const y = getY(value);

                  return (
                    <g key={value}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                      />
                      <text x={12} y={y + 4} fontSize="11" fill="#64748b">
                        {value}
                      </text>
                    </g>
                  );
                })}

                <line
                  x1={padding.left}
                  y1={padding.top}
                  x2={padding.left}
                  y2={chartHeight - padding.bottom}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
                <line
                  x1={padding.left}
                  y1={chartHeight - padding.bottom}
                  x2={chartWidth - padding.right}
                  y2={chartHeight - padding.bottom}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />

                {Array.from({ length: 10 }).map((_, index) => {
                  const value = Math.round((maxTwoTheta / 9) * index);
                  const x = getX(value);

                  return (
                    <g key={index}>
                      <line
                        x1={x}
                        y1={chartHeight - padding.bottom}
                        x2={x}
                        y2={chartHeight - padding.bottom + 6}
                        stroke="#0f172a"
                      />
                      <text
                        x={x}
                        y={chartHeight - 12}
                        fontSize="11"
                        fill="#64748b"
                        textAnchor="middle"
                      >
                        {value}
                      </text>
                    </g>
                  );
                })}

                <text
                  x={chartWidth / 2}
                  y={chartHeight - 2}
                  fontSize="12"
                  fill="#334155"
                  textAnchor="middle"
                >
                  2-theta (degrees)
                </text>
                <text
                  x={-chartHeight / 2}
                  y={18}
                  fontSize="12"
                  fill="#334155"
                  textAnchor="middle"
                  transform="rotate(-90)"
                >
                  Relative Intensity
                </text>

                {diffractionData.map(peak => {
                  const x = getX(peak.twoTheta);
                  const y = getY(peak.intensity);
                  const isSelected = peak.id === selectedPeak?.id;

                  return (
                    <g
                      key={peak.id}
                      onClick={() => setSelectedPeakId(peak.id)}
                      className="cursor-pointer"
                    >
                      <line
                        x1={x}
                        y1={chartHeight - padding.bottom}
                        x2={x}
                        y2={y}
                        stroke={isSelected ? '#dc2626' : '#2563eb'}
                        strokeWidth={isSelected ? 6 : 4}
                        strokeLinecap="round"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 7 : 5}
                        fill={isSelected ? '#dc2626' : '#0f172a'}
                      />
                      <text
                        x={x}
                        y={Math.max(y - 10, 16)}
                        fontSize="10"
                        fill={isSelected ? '#b91c1c' : '#334155'}
                        textAnchor="middle"
                        fontWeight={isSelected ? 700 : 500}
                      >
                        {formatPeakLabel(peak)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-base font-medium text-slate-900">Interactive Peak Table</h4>
            <p className="mt-1 text-sm text-slate-500">
              Select a row to sync with the graph and compute the lattice parameter from that
              diffraction peak.
            </p>

            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>(hkl)</TableHead>
                    <TableHead>d (A)</TableHead>
                    <TableHead>theta (deg)</TableHead>
                    <TableHead>2-theta (deg)</TableHead>
                    <TableHead>Intensity</TableHead>
                    <TableHead>Multiplicity</TableHead>
                    <TableHead>a from peak (A)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diffractionData.map(peak => {
                    const isSelected = peak.id === selectedPeak?.id;

                    return (
                      <TableRow
                        key={peak.id}
                        className={`cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedPeakId(peak.id)}
                      >
                        <TableCell className="font-medium">{formatPeakLabel(peak)}</TableCell>
                        <TableCell>{peak.dSpacing}</TableCell>
                        <TableCell>{peak.theta}</TableCell>
                        <TableCell>{peak.twoTheta}</TableCell>
                        <TableCell>{peak.intensity}</TableCell>
                        <TableCell>{peak.multiplicity}</TableCell>
                        <TableCell>{peak.latticeParameter}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XRayDiffractionSimulation;

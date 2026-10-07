import React from 'react';
import { RiskAssessment } from '../../types/supplier';

interface RiskRadarChartProps {
  assessment?: RiskAssessment;
  width?: number;
  height?: number;
}

export const RiskRadarChart: React.FC<RiskRadarChartProps> = ({
  assessment,
  width = 320,
  height = 280,
}) => {
  const financial = assessment?.financialScore ?? 25;
  const operational = assessment?.operationalScore ?? 30;
  const geopolitical = assessment?.geopoliticalScore ?? 40;
  const esg = assessment?.esgScore ?? 35;
  const cyber = assessment?.cyberScore ?? 30;

  const data = [
    { label: 'Financial', value: financial, angle: 0 },
    { label: 'Operational', value: operational, angle: 72 },
    { label: 'Geopolitical', value: geopolitical, angle: 144 },
    { label: 'ESG / Sustain.', value: esg, angle: 216 },
    { label: 'Cyber Sec.', value: cyber, angle: 288 },
  ];

  const centerX = width / 2;
  const centerY = height / 2 + 10;
  const maxRadius = Math.min(centerX, centerY) - 48;

  // Convert polar coordinates (angle in degrees, radius) to Cartesian coordinates
  const getCoordinates = (angleDeg: number, val: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    const r = (val / 100) * maxRadius;
    const x = centerX + r * Math.cos(angleRad);
    const y = centerY + r * Math.sin(angleRad);
    return { x, y };
  };

  // Polygon path for values
  const pointsString = data
    .map((d) => {
      const { x, y } = getCoordinates(d.angle, d.value);
      return `${x},${y}`;
    })
    .join(' ');

  // Levels for 25, 50, 75, 100
  const levels = [25, 50, 75, 100];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background Grids */}
        {levels.map((lvl) => {
          const gridPoints = data
            .map((d) => {
              const { x, y } = getCoordinates(d.angle, lvl);
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <polygon
              key={lvl}
              points={gridPoints}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={lvl < 100 ? '3 3' : 'none'}
            />
          );
        })}

        {/* Axis Lines */}
        {data.map((d) => {
          const outer = getCoordinates(d.angle, 100);
          return (
            <line
              key={d.label}
              x1={centerX}
              y1={centerY}
              x2={outer.x}
              y2={outer.y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={pointsString}
          fill="rgba(0, 112, 242, 0.22)"
          stroke="#0070f2"
          strokeWidth="2.5"
        />

        {/* Data points */}
        {data.map((d) => {
          const { x, y } = getCoordinates(d.angle, d.value);
          const color = d.value > 60 ? '#ba1717' : d.value > 30 ? '#c25900' : '#0d7f3e';
          return (
            <circle
              key={d.label}
              cx={x}
              cy={y}
              r="4.5"
              fill={color}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels */}
        {data.map((d) => {
          const labelCoord = getCoordinates(d.angle, 126);
          return (
            <text
              key={d.label}
              x={labelCoord.x}
              y={labelCoord.y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                fill: '#334155',
              }}
            >
              {d.label} ({d.value})
            </text>
          );
        })}
      </svg>
      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
        Scale: 0 (Min Risk) → 100 (Critical Risk)
      </div>
    </div>
  );
};

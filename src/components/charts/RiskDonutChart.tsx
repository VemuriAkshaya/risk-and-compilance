import React, { useState } from 'react';

interface RiskDonutChartProps {
  low: number;
  medium: number;
  high: number;
}

export const RiskDonutChart: React.FC<RiskDonutChartProps> = ({ low, medium, high }) => {
  const [hoveredSegment, setHoveredSegment] = useState<'low' | 'medium' | 'high' | null>(null);

  const total = low + medium + high || 1;
  const lowPercent = Math.round((low / total) * 100);
  const medPercent = Math.round((medium / total) * 100);
  const highPercent = Math.round((high / total) * 100);

  // SVG Donut calculations (radius = 70, strokeWidth = 24)
  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  const lowStroke = (low / total) * circumference;
  const medStroke = (medium / total) * circumference;
  const highStroke = (high / total) * circumference;

  const lowOffset = 0;
  const medOffset = -lowStroke;
  const highOffset = -(lowStroke + medStroke);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '24px' }}>
      <div style={{ position: 'relative', width: '180px', height: '180px' }}>
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="transparent"
            stroke="#edf2f7"
            strokeWidth="24"
          />

          {/* Low Risk Segment (Green) */}
          {low > 0 && (
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke="#0d7f3e"
              strokeWidth={hoveredSegment === 'low' ? '28' : '24'}
              strokeDasharray={`${lowStroke} ${circumference}`}
              strokeDashoffset={lowOffset}
              style={{ transition: 'stroke-width 0.2s ease, opacity 0.2s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredSegment('low')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}

          {/* Medium Risk Segment (Amber) */}
          {medium > 0 && (
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke="#c25900"
              strokeWidth={hoveredSegment === 'medium' ? '28' : '24'}
              strokeDasharray={`${medStroke} ${circumference}`}
              strokeDashoffset={medOffset}
              style={{ transition: 'stroke-width 0.2s ease, opacity 0.2s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredSegment('medium')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}

          {/* High Risk Segment (Red) */}
          {high > 0 && (
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke="#ba1717"
              strokeWidth={hoveredSegment === 'high' ? '28' : '24'}
              strokeDasharray={`${highStroke} ${circumference}`}
              strokeDashoffset={highOffset}
              style={{ transition: 'stroke-width 0.2s ease, opacity 0.2s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredSegment('high')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {hoveredSegment ? (
            <>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: hoveredSegment === 'low' ? '#0d7f3e' : hoveredSegment === 'medium' ? '#c25900' : '#ba1717' }}>
                {hoveredSegment === 'low' ? low : hoveredSegment === 'medium' ? medium : high}
              </span>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, color: '#64748b' }}>
                {hoveredSegment} Risk
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{total}</span>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, color: '#64748b' }}>
                Suppliers
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '170px' }}>
        <div
          onMouseEnter={() => setHoveredSegment('low')}
          onMouseLeave={() => setHoveredSegment(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: hoveredSegment === 'low' ? '#eaf8f0' : 'transparent',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0d7f3e' }} />
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b' }}>Low Risk (0–30)</span>
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0d7f3e' }}>
            {low} <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>({lowPercent}%)</span>
          </div>
        </div>

        <div
          onMouseEnter={() => setHoveredSegment('medium')}
          onMouseLeave={() => setHoveredSegment(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: hoveredSegment === 'medium' ? '#fff5eb' : 'transparent',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#c25900' }} />
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b' }}>Medium Risk (31–60)</span>
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#c25900' }}>
            {medium} <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>({medPercent}%)</span>
          </div>
        </div>

        <div
          onMouseEnter={() => setHoveredSegment('high')}
          onMouseLeave={() => setHoveredSegment(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: hoveredSegment === 'high' ? '#fdeeee' : 'transparent',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ba1717' }} />
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b' }}>High Risk (61–100)</span>
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ba1717' }}>
            {high} <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>({highPercent}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

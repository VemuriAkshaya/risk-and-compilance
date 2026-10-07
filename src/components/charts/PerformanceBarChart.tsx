import React from 'react';
import { Supplier } from '../../types/supplier';

interface PerformanceBarChartProps {
  suppliers: Supplier[];
}

export const PerformanceBarChart: React.FC<PerformanceBarChartProps> = ({ suppliers }) => {
  // Take top 6-8 suppliers for display
  const displayList = suppliers.slice(0, 7);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#0070f2' }} />
          <span>Overall Score</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#0d7f3e' }} />
          <span>Quality</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#8b5cf6' }} />
          <span>Delivery</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {displayList.map((s) => {
          const overall = s.performance?.overallScore ?? 80;
          const quality = s.performance?.qualityScore ?? 80;
          const delivery = s.performance?.deliveryScore ?? 80;

          return (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                <span style={{ color: '#1e293b' }}>
                  {s.name} <span style={{ color: '#64748b', fontWeight: 400 }}>({s.id})</span>
                </span>
                <span style={{ color: '#0070f2', fontVariantNumeric: 'tabular-nums' }}>
                  Overall: {overall}%
                </span>
              </div>

              {/* Multi-tier bar group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {/* Overall Bar */}
                <div style={{ height: '7px', width: '100%', backgroundColor: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${overall}%`,
                      backgroundColor: '#0070f2',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                {/* Sub-bars: Quality & Delivery */}
                <div style={{ display: 'flex', gap: '6px', height: '4px' }}>
                  <div style={{ flex: 1, backgroundColor: '#edf2f7', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${quality}%`,
                        backgroundColor: '#0d7f3e',
                      }}
                      title={`Quality: ${quality}%`}
                    />
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#edf2f7', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${delivery}%`,
                        backgroundColor: '#8b5cf6',
                      }}
                      title={`Delivery: ${delivery}%`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

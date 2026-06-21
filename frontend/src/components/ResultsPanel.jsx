import html2canvas from 'html2canvas';

export default function ResultsPanel({ results, meta, onDownload, getRiskColor, mapWidget }) {
  if (!results) {
    return (
      <section className="panel" id="resultsPanel">
        <div className="results-empty">
          <div className="dial-ghost">NO RUN<br />YET</div>
          <h3>Twin readout will appear here</h3>
          <p>Run a simulation on the left to generate a risk profile, resourcing plan, and AI recommendation for this event.</p>
        </div>
      </section>
    );
  }

  // Parse diversion strategy and nearby services from the AI recommendation
  const recommendation = results.recommendation || '';
  let diversionLine = '';
  let nearbyServicesLine = '';
  const recLines = recommendation.split('\n');
  for (const line of recLines) {
    const t = line.trim().replace(/^\*\s*/, '').replace(/^-\s*/, '');
    if (t.toLowerCase().startsWith('diversion strategy')) {
      diversionLine = t.replace(/^diversion strategy\s*:\s*/i, '');
    }
    if (t.toLowerCase().startsWith('nearby emergency')) {
      nearbyServicesLine = t.replace(/^nearby emergency services\s*:\s*/i, '');
    }
  }

  // Impact metric explanations based on values
  function getCongestionExplanation(mins) {
    if (mins > 40) return 'Severe congestion expected. Deploy traffic marshals at all nearby junctions.';
    if (mins > 25) return 'Moderate congestion likely. Expect delays on connecting roads.';
    if (mins > 10) return 'Minor congestion expected. Traffic may slow during peak hours.';
    return 'Minimal congestion impact. Normal flow expected on adjacent roads.';
  }

  function getClearanceExplanation(val) {
    const str = String(val).toLowerCase();
    if (str.includes('3') || str.includes('4') || str.includes('high')) return 'Extended clearance time. Ensure relief teams are pre-positioned.';
    if (str.includes('1') || str.includes('2') || str.includes('medium')) return 'Moderate clearance expected. Standard response protocol sufficient.';
    return 'Quick clearance anticipated. Minimal resource commitment needed.';
  }

  function getConfidenceExplanation(score) {
    if (score >= 90) return 'Very high confidence — strong match with multiple historical events.';
    if (score >= 75) return 'Good confidence — similar events have occurred in this area before.';
    if (score >= 60) return 'Moderate confidence — partial match with historical patterns.';
    return 'Low confidence — limited historical data. Use field judgment.';
  }

  function getHotspotExplanation(count) {
    if (count > 1000) return 'Very high incident density zone. This area frequently experiences traffic disruptions.';
    if (count > 500) return 'Moderate incident density. Multiple past events recorded in this corridor.';
    return 'Lower incident density area. Fewer historical events recorded nearby.';
  }

  async function handleDownloadMap() {
    const mapCard = document.querySelector('#resultsPanel .map-card');
    if (!mapCard) { window.print(); return; }

    try {
      const canvas = await html2canvas(mapCard, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#0B0E14',
        logging: false,
      });

      // Add header and legend
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height + 80;
      const ctx = finalCanvas.getContext('2d');

      // Header bar
      ctx.fillStyle = '#0B0E14';
      ctx.fillRect(0, 0, finalCanvas.width, 40);
      ctx.fillStyle = '#FFB020';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`ASTRAM — ${meta.location} — ${meta.cause}`, 20, 26);

      // Map content
      ctx.drawImage(canvas, 0, 40);

      // Legend bar
      const legendY = canvas.height + 40;
      ctx.fillStyle = '#0B0E14';
      ctx.fillRect(0, legendY, finalCanvas.width, 40);
      ctx.fillStyle = '#E8ECF4';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText('E = Event Center    B = Barricade    P = Police Post', 20, legendY + 25);

      const link = document.createElement('a');
      link.download = `astram-map-${meta.location.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = finalCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Map download failed:', err);
      window.print();
    }
  }

  const confidencePct = Math.round(results.confidence_score * 100);

  return (
    <section className="panel" id="resultsPanel">
      <div className="readout-head">
        <div className="loc" id="rLocation">{meta.location}
          <span className="meta">{`${meta.eventType.toUpperCase()} · ${meta.cause}${meta.roadClosure ? ' · road closure' : ''}`}</span>
        </div>
      </div>

      {/* Risk Profile */}
      <div className="section-label">Risk profile</div>
      <div className="dial-wrap">
        <div className="dial">
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r="62" fill="none" stroke="#1B2233" strokeWidth="14" />
            <circle cx="75" cy="75" r="62" fill="none" stroke={getRiskColor(results.risk_level)} strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="389.6"
              strokeDashoffset={389.6 - Math.max(0.06, Math.min(results.risk_score / 13, 1)) * 389.6}
              style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.3s' }}
            />
          </svg>
          <div className="dial-center">
            <div className="lvl" style={{ color: getRiskColor(results.risk_level) }}>{results.risk_level}</div>
            <div className="score">score {results.risk_score}/13</div>
          </div>
        </div>
        <div className="dial-info">
          <div className="label">Similarity to historical events</div>
          <div className="desc">
            Matched with a similarity score of <b>{results.similarity_score}</b> against the 5 closest historical events in the Bengaluru traffic database.
          </div>
          <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9em' }}>
            <strong style={{ color: 'var(--amber)' }}>📊 Historical Prediction:</strong>
            <div style={{ marginTop: '4px', opacity: 0.85, lineHeight: '1.5' }}>
              {results.similarity_score > 0.7
                ? `Based on historical data, events very similar to this have occurred frequently in this area. Previous incidents of this type at ${meta.location} typically required ${results.police_required}+ officers and caused ${results.expected_congestion_minutes}+ minutes of congestion.`
                : results.similarity_score > 0.4
                ? `Moderately similar events have been recorded near ${meta.location}. Historical patterns suggest resource needs align with the current estimate. Prior events of this nature had moderate traffic impact.`
                : `Limited historical precedent for this specific event at ${meta.location}. Predictions are based on broader event-type patterns across Bengaluru. Field commanders should use judgment and adjust resources as the situation develops.`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Spatial Layout */}
      <div className="section-label">Spatial layout — barricades & police posts</div>
      <div className="map-card">
        <div className="map-toolbar">
          <div className="geo-status"><span className="dot ok" /> plotted</div>
          <div className="legend">
            <div className="item"><span className="swatch" style={{ background: '#FF4B4B', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#000' }}>E</span> Event center</div>
            <div className="item"><span className="swatch" style={{ background: '#FFB020', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#000' }}>B</span> Barricade</div>
            <div className="item"><span className="swatch" style={{ background: '#34D399', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#000' }}>P</span> Police post</div>
          </div>
        </div>
        {mapWidget || (
          <div id="mapContainer">
            <div className="map-fallback">
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>MAP IDLE</div>
              <div>Run a simulation to plot the event on the map.</div>
            </div>
          </div>
        )}
        {results.placement_strategy && (
          <div className="map-note" style={{ display: 'block' }}>
            <b>Strategy:</b> {results.placement_strategy.replace('_', ' ').toUpperCase()} — {results.placement_description}
          </div>
        )}
      </div>

      {/* Diversion Strategy */}
      {diversionLine && (
        <>
          <div className="section-label">Diversion Strategy</div>
          <div style={{ marginBottom: '10px', padding: '14px 18px', background: 'var(--bg-card)', borderRadius: '8px', borderLeft: '4px solid var(--blue)', border: '1px solid var(--border)', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
            <strong style={{ color: '#fff', fontSize: '1.05em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>🔀 Traffic Diversion</strong>
            <span style={{ opacity: 0.9, lineHeight: '1.7', display: 'block' }}>{diversionLine}</span>
          </div>
        </>
      )}

      {/* Resourcing */}
      <div className="section-label">Resourcing required</div>
      <div className="resource-row">
        <div className="resource"><div className="icon">👮</div><div><div className="r-num">{results.police_required}</div><div className="r-lbl">Police officers</div></div></div>
        <div className="resource"><div className="icon">🚧</div><div><div className="r-num">{results.barricades_required}</div><div className="r-lbl">Barricades</div></div></div>
        <div className="resource"><div className="icon">↪️</div><div><div className="r-num">{results.diversions}</div><div className="r-lbl">Diversion routes</div></div></div>
      </div>

      {/* Nearby Services */}
      {nearbyServicesLine && (
        <>
          <div className="section-label">Nearby Emergency Services</div>
          <div style={{ padding: '14px 18px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '6px' }}>
            {nearbyServicesLine.split('.').filter(s => s.trim()).map((service, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--green)', fontSize: '1.1em', flexShrink: 0 }}>📍</span>
                <span style={{ opacity: 0.9, lineHeight: '1.5' }}>{service.trim()}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {results.nearby_police_station && results.nearby_police_station !== 'Unknown' && (
        <div style={{ padding: '10px 16px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '12px', fontSize: '0.9em' }}>
          <strong>📋 Jurisdiction:</strong> {results.nearby_police_station} Police Station (from historical data)
        </div>
      )}

      {/* Impact Metrics with explanations */}
      <div className="section-label">Impact metrics</div>
      <div className="metric-grid">
        <div className="metric">
          <div className="m-label">Congestion</div>
          <div className="m-value">{results.expected_congestion_minutes}<span className="unit">min</span></div>
          <div className="m-detail">{getCongestionExplanation(results.expected_congestion_minutes)}</div>
        </div>
        <div className="metric">
          <div className="m-label">Est. clearance</div>
          <div className="m-value">{results.estimated_clearance_time}</div>
          <div className="m-detail">{getClearanceExplanation(results.estimated_clearance_time)}</div>
        </div>
        <div className="metric">
          <div className="m-label">Confidence</div>
          <div className="m-value">{confidencePct}%</div>
          <div className="m-detail">{getConfidenceExplanation(confidencePct)}</div>
        </div>
        <div className="metric">
          <div className="m-label">Nearby hotspots</div>
          <div className="m-value">{results.hotspots}</div>
          <div className="m-detail">{getHotspotExplanation(results.hotspots)}</div>
        </div>
      </div>

      {/* AI Response Plan */}
      <div className="section-label">AI response plan — Groq / Llama 3.3</div>
      <div className="console-head" style={{ marginBottom: '12px', background: 'var(--bg-card)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
        <span className="dot"></span> astram-eventtwin · recommendation.log
      </div>

      {results.recommendation ? (
        <div className="recommendation-visuals">
          {results.recommendation.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
              const cleanLine = trimmed.replace(/^[\*\-]\s*/, '');
              const colonIdx = cleanLine.indexOf(':');
              if (colonIdx > -1 && colonIdx < 50) {
                const key = cleanLine.slice(0, colonIdx).trim();
                const val = cleanLine.slice(colonIdx + 1).trim();

                let borderColor = 'var(--blue)';
                let icon = '📋';
                const keyLower = key.toLowerCase();
                if (keyLower.includes('risk')) { borderColor = getRiskColor(results.risk_level); icon = '⚠️'; }
                else if (keyLower.includes('police')) { borderColor = 'var(--green)'; icon = '👮'; }
                else if (keyLower.includes('barricade')) { borderColor = 'var(--amber)'; icon = '🚧'; }
                else if (keyLower.includes('diversion')) { borderColor = '#5B8DEF'; icon = '🔀'; }
                else if (keyLower.includes('nearby') || keyLower.includes('emergency')) { borderColor = 'var(--green)'; icon = '🏥'; }
                else if (keyLower.includes('impact') || keyLower.includes('duration')) { borderColor = 'var(--amber)'; icon = '⏱️'; }
                else if (keyLower.includes('explanation') || keyLower.includes('summary')) { borderColor = '#8B5CF6'; icon = '💡'; }

                return (
                  <div key={idx} style={{ marginBottom: '10px', padding: '14px 18px', background: 'var(--bg-card)', borderRadius: '8px', borderLeft: `4px solid ${borderColor}`, borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                    <strong style={{ color: '#fff', fontSize: '1.05em', display: 'block', marginBottom: '5px' }}>{icon} {key}</strong>
                    <span style={{ opacity: 0.85, lineHeight: '1.7', display: 'block' }}>{val}</span>
                  </div>
                );
              }
              return (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', padding: '0 8px' }}>
                  <span style={{ color: 'var(--blue)' }}>•</span>
                  <span style={{ opacity: 0.85, lineHeight: '1.5' }}>{cleanLine}</span>
                </div>
              );
            } else {
              return <p key={idx} style={{ margin: '0 8px 12px 8px', opacity: 0.85, lineHeight: '1.5' }}>{trimmed}</p>;
            }
          })}
        </div>
      ) : (
        <div style={{ opacity: 0.6, padding: '12px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>(no recommendation returned)</div>
      )}

      {/* Download buttons at the bottom */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
        <button className="btn-mini" type="button" onClick={onDownload}>📄 Download PDF Report</button>
        <button className="btn-mini" type="button" onClick={handleDownloadMap}>🗺️ Download Planned Map</button>
      </div>
    </section>
  );
}

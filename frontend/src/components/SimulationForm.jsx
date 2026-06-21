import { useMemo } from 'react';

const causeOptions = [
  'Political Rally',
  'Protest / Demonstration',
  'Road Construction',
  'Vehicle Breakdown',
  'Accident',
  'VIP Movement',
  'Religious Procession',
  'Sports Event',
  'Concert / Public Gathering',
  'Waterlogging',
  'Tree Fall',
  '__other'
];

export default function SimulationForm({ values, onChange, onRun, running, errorMessage, onDetectLocation, previewWidget }) {
  const showCustomCause = values.eventCause === '__other';
  const geometryMode = values.geometryMode;

  const causeLabel = useMemo(() => {
    if (values.eventCause === '__other') return 'Other (type below)';
    return values.eventCause;
  }, [values.eventCause]);

  return (
    <section className="panel">
      <div className="panel-title">Simulate Event <span className="tag">Digital Twin</span></div>
      <p className="panel-sub">Fill in event details and location. ASTRAM runs it against similar historical events and Bengaluru hotspot density to generate a deployment plan.</p>

      <div className="field">
        <label>Event type</label>
        <div className="seg">
          {['planned', 'unplanned'].map(type => (
            <button
              key={type}
              type="button"
              className={values.eventType === type ? 'active' : ''}
              onClick={() => onChange('eventType', type)}
            >
              {type === 'planned' ? 'Planned' : 'Unplanned'}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="eventCause">Event cause</label>
        <select id="eventCause" value={values.eventCause} onChange={e => onChange('eventCause', e.target.value)}>
          {causeOptions.map(option => (
            <option key={option} value={option}>{option === '__other' ? 'Other (type below)' : option}</option>
          ))}
        </select>
      </div>

      {showCustomCause && (
        <div className="field">
          <label htmlFor="customCause">Custom cause</label>
          <input
            id="customCause"
            type="text"
            placeholder="e.g. Tree fall blocking 2 lanes"
            value={values.customCause}
            onChange={e => onChange('customCause', e.target.value)}
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="location">Location <span style={{ opacity: 0.5, fontSize: '0.85em' }}>(or click on the map below)</span></label>
        <input
          id="location"
          type="text"
          placeholder="e.g. Silk Board Junction"
          autoComplete="off"
          value={values.location}
          onChange={e => onChange('location', e.target.value)}
          onBlur={onDetectLocation}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onDetectLocation(); } }}
        />
      </div>

      <div className="field">
        <label>Location preview</label>
        <div className="map-card" style={{ padding: 0, marginTop: 0 }}>
          {previewWidget || (
            <div id="formMapContainer" style={{ width: '100%', height: '220px', background: '#0A0D14', position: 'relative' }}>
              <div className="map-fallback" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--muted)' }}>FORM MAP IDLE</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Enter a location and choose point or span geometry.</div>
              </div>
            </div>
          )}
          <div className="map-note" style={{ display: 'block', padding: '12px 16px', borderTop: '1px solid var(--line)', background: 'rgba(255,176,32,0.04)', fontSize: '11px' }}>Click on the map to set the event location. The location field will be auto-filled.</div>
        </div>
      </div>

      <div className="field">
        <label>Geometry mode</label>
        <div className="seg">
          {['point', 'span'].map(mode => (
            <button
              key={mode}
              type="button"
              className={geometryMode === mode ? 'active' : ''}
              onClick={() => onChange('geometryMode', mode)}
            >
              {mode === 'point' ? 'Point' : 'Span / radius'}
            </button>
          ))}
        </div>
      </div>

      {geometryMode === 'point' ? (
        <div className="field geometry-field">
          <label>Point coordinates</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input
              type="text"
              id="centerLat"
              placeholder="Latitude"
              value={values.centerLat}
              onChange={e => onChange('centerLat', e.target.value)}
            />
            <input
              type="text"
              id="centerLng"
              placeholder="Longitude"
              value={values.centerLng}
              onChange={e => onChange('centerLng', e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="field geometry-field">
          <label>Start / end coordinates</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input type="text" id="startLat" placeholder="Start lat" value={values.startLat} onChange={e => onChange('startLat', e.target.value)} />
            <input type="text" id="startLng" placeholder="Start lng" value={values.startLng} onChange={e => onChange('startLng', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <input type="text" id="endLat" placeholder="End lat" value={values.endLat} onChange={e => onChange('endLat', e.target.value)} />
            <input type="text" id="endLng" placeholder="End lng" value={values.endLng} onChange={e => onChange('endLng', e.target.value)} />
          </div>
          <label htmlFor="radiusMeters" style={{ marginTop: '10px' }}>Circle radius (m)</label>
          <input type="number" id="radiusMeters" placeholder="e.g. 250" value={values.radiusMeters} onChange={e => onChange('radiusMeters', e.target.value)} />
        </div>
      )}

      <div className="field">
        <label>Event timing <span style={{ opacity: 0.5, fontSize: '0.85em' }}>(optional)</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label htmlFor="startTime" style={{ fontSize: '11px', opacity: 0.6 }}>Start time</label>
            <input type="datetime-local" id="startTime" value={values.startTime || ''} onChange={e => onChange('startTime', e.target.value)} />
          </div>
          <div>
            <label htmlFor="endTime" style={{ fontSize: '11px', opacity: 0.6 }}>End time</label>
            <input type="datetime-local" id="endTime" value={values.endTime || ''} onChange={e => onChange('endTime', e.target.value)} />
          </div>
        </div>
      </div>

      {(values.eventCause === 'Political Rally' || values.eventCause === 'Protest / Demonstration' ||
        values.eventCause === 'Sports Event' || values.eventCause === 'Concert / Public Gathering' ||
        values.eventCause === 'Religious Procession') && (
        <div className="field">
          <label htmlFor="expectedCrowd">Expected crowd size</label>
          <input
            id="expectedCrowd"
            type="number"
            placeholder="e.g. 5000"
            value={values.expectedCrowd || ''}
            onChange={e => onChange('expectedCrowd', e.target.value)}
          />
        </div>
      )}

      <div className="field">
        <div className="switch-row">
          <span>Road closure</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={values.roadClosure}
              onChange={e => onChange('roadClosure', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <button className={`run-btn ${running ? 'loading' : ''}`} type="button" disabled={running} onClick={onRun}>
        <span className="spin" />
        <span>{running ? 'Running twin…' : 'Run simulation'}</span>
      </button>

      {errorMessage && <div className="err-banner" style={{ display: 'block' }}>{errorMessage}</div>}
    </section>
  );
}

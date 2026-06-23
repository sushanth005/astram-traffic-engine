import { useEffect, useMemo, useState } from 'react';
import Topbar from './components/Topbar.jsx';
import SimulationForm from './components/SimulationForm.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import LeafletMap from './components/LeafletMap.jsx';

const API_BASE = import.meta.env.PROD ? "https://astram-engine-backend.onrender.com" : "http://localhost:8000";
const DEFAULT_LOCATION = 'MG Road';

function safeJson(response) {
  return response.json().catch(() => ({}));
}

function getRiskColor(level) {
  if (level === 'HIGH') return 'var(--red)';
  if (level === 'MEDIUM') return 'var(--amber)';
  return 'var(--green)';
}

export default function App() {
  const [healthStatus, setHealthStatus] = useState('checking…');
  const [healthOk, setHealthOk] = useState(false);
  const [theme, setTheme] = useState('light');

  const [formValues, setFormValues] = useState({
    eventType: 'planned',
    eventCause: 'Political Rally',
    customCause: '',
    location: DEFAULT_LOCATION,
    geometryMode: 'point',
    centerLat: '',
    centerLng: '',
    startLat: '',
    startLng: '',
    endLat: '',
    endLng: '',
    radiusMeters: '',
    roadClosure: false,
    startTime: '',
    endTime: '',
    expectedCrowd: '',
  });

  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [previewCenter, setPreviewCenter] = useState({ lat: 12.9716, lng: 77.5946 });
  const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 });
  const [mapMarkers, setMapMarkers] = useState([]);
  const [mapRadius, setMapRadius] = useState(0);

  const previewMarkers = useMemo(() => {
    const markers = [];
    const point = formValues.centerLat && formValues.centerLng
      ? { lat: parseFloat(formValues.centerLat), lng: parseFloat(formValues.centerLng) }
      : previewCenter;
    if (point && Number.isFinite(point.lat) && Number.isFinite(point.lng)) {
      markers.push({ lat: point.lat, lng: point.lng, color: '#FF4B4B' });
    }
    if (formValues.geometryMode === 'span' && formValues.startLat && formValues.startLng) {
      markers.push({ lat: parseFloat(formValues.startLat), lng: parseFloat(formValues.startLng), color: '#FFB020' });
    }
    if (formValues.geometryMode === 'span' && formValues.endLat && formValues.endLng) {
      markers.push({ lat: parseFloat(formValues.endLat), lng: parseFloat(formValues.endLng), color: '#34D399' });
    }
    return markers;
  }, [formValues, previewCenter]);

  const previewPath = useMemo(() => {
    if (formValues.geometryMode === 'span' && formValues.startLat && formValues.startLng && formValues.endLat && formValues.endLng) {
      return [
        { lat: parseFloat(formValues.startLat), lng: parseFloat(formValues.startLng) },
        { lat: parseFloat(formValues.endLat), lng: parseFloat(formValues.endLng) }
      ];
    }
    return [];
  }, [formValues]);

  const previewRadius = formValues.geometryMode === 'point'
    ? (Number(formValues.radiusMeters) || 0)
    : 0;

  useEffect(() => {
    checkHealth();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function checkHealth() {
    setHealthStatus('checking…');
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || 'offline');
      setHealthOk(true);
      setHealthStatus(data.status || 'connected');
    } catch (err) {
      setHealthOk(false);
      setHealthStatus('offline');
    }
  }

  async function geocodeLocation(query) {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query + ', Bengaluru, India')}`;
    try {
      const res = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
      const data = await safeJson(res);
      if (Array.isArray(data) && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (err) {
      // ignore geocode failure
    }
    return { lat: 12.9716, lng: 77.5946 };
  }

  async function reverseGeocode(lat, lng) {
    const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    try {
      const res = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
      const data = await safeJson(res);
      if (data && data.address) {
        const addr = data.address;
        // Build a readable name: road > neighbourhood > suburb
        const road = addr.road || addr.pedestrian || addr.footway || '';
        const area = addr.neighbourhood || addr.suburb || addr.village || '';
        if (road && area) return `${road}, ${area}`;
        if (road) return road;
        if (area) return area;
        if (data.display_name) {
          // Take first 2 parts of the display name
          const parts = data.display_name.split(',').slice(0, 2).map(s => s.trim());
          return parts.join(', ');
        }
      }
    } catch (err) {
      // ignore
    }
    return '';
  }

  async function detectZoneCorridor(query) {
    if (!query?.trim()) return;
    try {
      const locationData = await geocodeLocation(query);
      setPreviewCenter(locationData);
    } catch (err) {
      // ignore detection failure
    }
  }

  async function snapToRoad(lat, lng) {
    try {
      const res = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`);
      const data = await safeJson(res);
      if (data.waypoints && data.waypoints.length > 0) {
        return {
          lat: data.waypoints[0].location[1],
          lng: data.waypoints[0].location[0],
          name: data.waypoints[0].name || ''
        };
      }
    } catch (err) {
      console.error('Snapping failed', err);
    }
    return { lat, lng, name: '' };
  }

  // Snap a point and validate it's within ~100m of center
  async function snapNearCenter(centerLat, centerLng, offsetLat, offsetLng) {
    const snapped = await snapToRoad(centerLat + offsetLat, centerLng + offsetLng);
    // Validate the snapped point is close (within ~200m)
    const dlat = Math.abs(snapped.lat - centerLat);
    const dlng = Math.abs(snapped.lng - centerLng);
    if (dlat > 0.002 || dlng > 0.002) {
      // Out of bounds - fall back to a closer snap
      return await snapToRoad(centerLat + offsetLat * 0.3, centerLng + offsetLng * 0.3);
    }
    return snapped;
  }

  async function handleRun(payload) {
    setErrorMessage('');
    setRunning(true);
    setResults(null);
    try {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await safeJson(res);
      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || 'Simulation failed');
      }
      setResults(data);

      const center = formValues.centerLat && formValues.centerLng
        ? { lat: parseFloat(formValues.centerLat), lng: parseFloat(formValues.centerLng) }
        : previewCenter;
      setMapCenter(center);
      setMapRadius(Number(formValues.radiusMeters) || 0);

      const markers = [];
      const strategy = data.placement_strategy || 'road_block';

      // Event center
      const ec = await snapToRoad(center.lat, center.lng);
      markers.push({ ...ec, color: '#FF4B4B', type: 'center', label: ec.name ? `Event: ${ec.name}` : 'Event Center' });

      if (formValues.geometryMode === 'span' && formValues.startLat && formValues.startLng && formValues.endLat && formValues.endLng) {
        const start = await snapToRoad(parseFloat(formValues.startLat), parseFloat(formValues.startLng));
        const end = await snapToRoad(parseFloat(formValues.endLat), parseFloat(formValues.endLng));
        markers.push({ ...start, color: '#FFB020', type: 'barricade', label: start.name ? `Barricade: ${start.name}` : 'Barricade' });
        markers.push({ ...end, color: '#FFB020', type: 'barricade', label: end.name ? `Barricade: ${end.name}` : 'Barricade' });
        const midLat = (start.lat + end.lat) / 2;
        const midLng = (start.lng + end.lng) / 2;
        const police = await snapToRoad(midLat, midLng);
        markers.push({ ...police, color: '#34D399', type: 'police', label: police.name ? `Police: ${police.name}` : 'Police Post' });
      } else {
        // Point mode — tight placement along the SAME road
        if (strategy === 'road_block' || strategy === 'lane_closure') {
          // ~30m north and south on the same road
          const b1 = await snapNearCenter(center.lat, center.lng, 0.00025, 0);
          const b2 = await snapNearCenter(center.lat, center.lng, -0.00025, 0);
          markers.push({ ...b1, color: '#FFB020', type: 'barricade', label: b1.name ? `Barricade: ${b1.name}` : 'Barricade' });
          markers.push({ ...b2, color: '#FFB020', type: 'barricade', label: b2.name ? `Barricade: ${b2.name}` : 'Barricade' });
          const p1 = await snapNearCenter(center.lat, center.lng, 0.00012, 0.00012);
          markers.push({ ...p1, color: '#34D399', type: 'police', label: p1.name ? `Police: ${p1.name}` : 'Police Post' });
        } else if (strategy === 'perimeter') {
          // ~50m in 4 directions — approach roads
          const dirs = [
            { dlat: 0.0004, dlng: 0 },
            { dlat: 0, dlng: 0.0004 },
            { dlat: -0.0004, dlng: 0 },
            { dlat: 0, dlng: -0.0004 },
          ];
          for (const d of dirs) {
            const b = await snapNearCenter(center.lat, center.lng, d.dlat, d.dlng);
            markers.push({ ...b, color: '#FFB020', type: 'barricade', label: b.name ? `Barricade: ${b.name}` : 'Barricade' });
          }
          const p1 = await snapNearCenter(center.lat, center.lng, 0.0002, 0.0002);
          const p2 = await snapNearCenter(center.lat, center.lng, -0.0002, -0.0002);
          markers.push({ ...p1, color: '#34D399', type: 'police', label: p1.name ? `Police: ${p1.name}` : 'Police Post' });
          markers.push({ ...p2, color: '#34D399', type: 'police', label: p2.name ? `Police: ${p2.name}` : 'Police Post' });
        } else if (strategy === 'corridor') {
          // Along a line ~60m spread
          const dirs = [
            { dlat: 0.0005, dlng: 0 },
            { dlat: 0.00025, dlng: 0.00025 },
            { dlat: -0.00025, dlng: 0.00025 },
            { dlat: -0.0005, dlng: 0 },
          ];
          for (const d of dirs) {
            const b = await snapNearCenter(center.lat, center.lng, d.dlat, d.dlng);
            markers.push({ ...b, color: '#FFB020', type: 'barricade', label: b.name ? `Barricade: ${b.name}` : 'Barricade' });
          }
          const ph = await snapNearCenter(center.lat, center.lng, 0.0004, 0);
          const pt = await snapNearCenter(center.lat, center.lng, -0.0004, 0);
          markers.push({ ...ph, color: '#34D399', type: 'police', label: ph.name ? `Police: ${ph.name}` : 'Police Post' });
          markers.push({ ...pt, color: '#34D399', type: 'police', label: pt.name ? `Police: ${pt.name}` : 'Police Post' });
        }
      }

      setMapMarkers(markers);
    } catch (err) {
      setErrorMessage(`Could not reach ASTRAM backend — ${err.message}`);
    } finally {
      setRunning(false);
    }
  }

  function handleFormChange(field, value) {
    setFormValues(prev => ({ ...prev, [field]: value }));
  }

  async function handlePreviewMapClick(latlng) {
    // Reverse geocode the clicked point to get a road name
    const locationName = await reverseGeocode(latlng.lat, latlng.lng);

    setFormValues(prev => {
      const update = { ...prev };

      if (prev.geometryMode === 'point') {
        update.centerLat = latlng.lat.toFixed(6);
        update.centerLng = latlng.lng.toFixed(6);
        if (locationName) {
          update.location = locationName;
        }
      } else {
        if (!prev.startLat || !prev.startLng) {
          update.startLat = latlng.lat.toFixed(6);
          update.startLng = latlng.lng.toFixed(6);
        } else if (!prev.endLat || !prev.endLng) {
          update.endLat = latlng.lat.toFixed(6);
          update.endLng = latlng.lng.toFixed(6);
        } else {
          update.startLat = latlng.lat.toFixed(6);
          update.startLng = latlng.lng.toFixed(6);
        }
        if (locationName && !prev.location.trim()) {
          update.location = locationName;
        }
      }

      return update;
    });
    setPreviewCenter({ lat: latlng.lat, lng: latlng.lng });
  }

  function buildPayload() {
    const cause = formValues.eventCause === '__other' ? (formValues.customCause.trim() || 'Other') : formValues.eventCause;
    const radiusValue = Number(formValues.radiusMeters);

    return {
      event_type: formValues.eventType,
      event_cause: cause,
      location: formValues.location.trim() || DEFAULT_LOCATION,
      road_closure: formValues.roadClosure,
      start_point: formValues.startLat && formValues.startLng ? { lat: parseFloat(formValues.startLat), lng: parseFloat(formValues.startLng) } : null,
      end_point: formValues.endLat && formValues.endLng ? { lat: parseFloat(formValues.endLat), lng: parseFloat(formValues.endLng) } : null,
      radius_meters: Number.isFinite(radiusValue) ? radiusValue : null,
      start_time: formValues.startTime || null,
      end_time: formValues.endTime || null,
      expected_crowd: formValues.expectedCrowd ? parseInt(formValues.expectedCrowd) : null,
    };
  }

  return (
    <div className={`app-shell ${theme === 'light' ? 'light-theme' : ''}`} data-theme={theme}>
      <Topbar
        statusText={healthStatus}
        statusOk={healthOk}
        onRecheck={checkHealth}
        currentTime={currentTime}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />

      <div className="hero">
        <div className="eyebrow">Event Digital Twin</div>
        <h1>Simulate any road event before it <span>hits the street.</span></h1>
        <p>Describe a planned or unplanned event and ASTRAM builds a digital twin from historical Bengaluru traffic data — risk level, resourcing, expected congestion, and an AI-generated response plan.</p>
      </div>

      <div className="layout">
        <SimulationForm
          values={formValues}
          onChange={handleFormChange}
          onRun={() => handleRun(buildPayload())}
          running={running}
          errorMessage={errorMessage}
          onDetectLocation={() => detectZoneCorridor(formValues.location)}
          previewWidget={
            <LeafletMap
              center={previewCenter}
              markers={previewMarkers}
              path={previewPath}
              radius={previewRadius}
              onMapClick={handlePreviewMapClick}
              allowFullscreen={true}
            />
          }
        />
        <ResultsPanel
          results={results}
          meta={{
            eventType: formValues.eventType,
            location: formValues.location || DEFAULT_LOCATION,
            cause: formValues.eventCause === '__other' ? (formValues.customCause || 'Other') : formValues.eventCause,
            roadClosure: formValues.roadClosure,
          }}
          onDownload={() => window.print()}
          getRiskColor={getRiskColor}
          mapWidget={
            <LeafletMap
              center={mapCenter}
              markers={mapMarkers}
              radius={mapRadius}
            />
          }
        />
      </div>

      <footer>
        &copy; {new Date().getFullYear()} Astram Traffic Engine. All rights reserved.
      </footer>
    </div>
  );
}

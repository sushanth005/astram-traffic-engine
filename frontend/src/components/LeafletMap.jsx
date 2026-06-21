import { useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function makeIcon(type, color) {
  let letter = '●';
  let bg = color || '#FF4B4B';
  let border = '#fff';
  let size = 24;

  if (type === 'center') {
    letter = 'E';
    bg = '#FF4B4B';
  } else if (type === 'barricade') {
    letter = 'B';
    bg = '#FFB020';
  } else if (type === 'police') {
    letter = 'P';
    bg = '#34D399';
  }

  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border:2px solid ${border};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#000;font-family:Inter,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${letter}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function LeafletMap({ center, markers = [], path = [], radius, onMapClick, allowFullscreen = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const clickMarkerRef = useRef(null);
  const lastCenterRef = useRef(null);
  const isFullscreenRef = useRef(false);

  const toggleFullscreen = useCallback(() => {
    const wrapper = containerRef.current?.parentElement;
    if (!wrapper) return;
    if (!isFullscreenRef.current) {
      wrapper.style.position = 'fixed';
      wrapper.style.inset = '0';
      wrapper.style.zIndex = '9999';
      wrapper.style.width = '100vw';
      wrapper.style.height = '100vh';
      wrapper.style.borderRadius = '0';
      isFullscreenRef.current = true;
    } else {
      wrapper.style.position = '';
      wrapper.style.inset = '';
      wrapper.style.zIndex = '';
      wrapper.style.width = '';
      wrapper.style.height = '';
      wrapper.style.borderRadius = '';
      isFullscreenRef.current = false;
    }
    if (mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 100);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([center.lat, center.lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      layerGroupRef.current = L.layerGroup().addTo(mapRef.current);
      lastCenterRef.current = { lat: center.lat, lng: center.lng };

      if (allowFullscreen) {
        const FullscreenControl = L.Control.extend({
          options: { position: 'topright' },
          onAdd: function () {
            const btn = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            btn.innerHTML = '<a href="#" title="Toggle fullscreen" style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;font-size:16px;text-decoration:none;color:#333;background:#fff;">⛶</a>';
            btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); toggleFullscreen(); };
            return btn;
          }
        });
        new FullscreenControl().addTo(mapRef.current);
      }
    }

    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;

    map.off('click');
    if (onMapClick) {
      map.on('click', e => {
        if (clickMarkerRef.current) {
          clickMarkerRef.current.remove();
        }
        clickMarkerRef.current = L.circleMarker(e.latlng, {
          radius: 8,
          fillColor: '#FFFFFF',
          color: '#FF4B4B',
          weight: 2,
          fillOpacity: 0.9,
          interactive: false
        }).addTo(layerGroup);
        onMapClick(e.latlng);
      });
      map.getContainer().style.cursor = 'crosshair';
      map.getContainer().style.pointerEvents = 'auto';
    } else {
      map.getContainer().style.cursor = '';
    }

    layerGroup.clearLayers();

    // Only pan when center actually changes
    if (center && lastCenterRef.current) {
      const dlat = Math.abs(center.lat - lastCenterRef.current.lat);
      const dlng = Math.abs(center.lng - lastCenterRef.current.lng);
      if (dlat > 0.0001 || dlng > 0.0001) {
        map.setView([center.lat, center.lng], map.getZoom());
        lastCenterRef.current = { lat: center.lat, lng: center.lng };
      }
    }
    map.invalidateSize();

    if (radius && center) {
      L.circle([center.lat, center.lng], {
        radius,
        color: '#5B8DEF',
        fillColor: '#5B8DEF',
        fillOpacity: 0.08,
        weight: 1
      }).addTo(layerGroup);
    }

    markers.forEach(marker => {
      const icon = makeIcon(marker.type, marker.color);
      const m = L.marker([marker.lat, marker.lng], { icon }).addTo(layerGroup);

      if (marker.label) {
        m.bindTooltip(marker.label, {
          permanent: false,
          direction: 'top',
          offset: [0, -14],
          className: 'marker-tooltip'
        });
      }
    });

    if (path && path.length > 1) {
      L.polyline(path.map(p => [p.lat, p.lng]), {
        color: '#5B8DEF',
        weight: 5,
        opacity: 0.85,
        dashArray: '8,6'
      }).addTo(layerGroup);
    }

    // Only auto-fit on results map
    if (!onMapClick && markers.length > 0) {
      const bounds = L.latLngBounds();
      markers.forEach(m => bounds.extend([m.lat, m.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
      }
    }
  }, [center, markers, path, radius, onMapClick]);

  return <div className="leaflet-map-wrapper"><div ref={containerRef} className="leaflet-map" /></div>;
}

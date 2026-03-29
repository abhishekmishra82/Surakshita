import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const sosIcon = new L.DivIcon({
  html: '<div style="background:#dc2626;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px #dc2626;animation:none;"></div>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function LiveMap({ lat, lng, zoom = 15, showRadius = false }) {
  if (!lat || !lng) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', borderRadius: 'var(--radius)', color: 'var(--text-muted)' }}>
        📍 Location unavailable
      </div>
    );
  }

  return (
    <MapContainer center={[lat, lng]} zoom={zoom} style={{ height: '100%', width: '100%' }} zoomControl={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={sosIcon}>
        <Popup>Your current location</Popup>
      </Marker>
      {showRadius && (
        <Circle center={[lat, lng]} radius={100} pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.1 }} />
      )}
    </MapContainer>
  );
}

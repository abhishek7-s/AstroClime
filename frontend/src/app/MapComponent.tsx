'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- TypeScript Type Definitions ---
interface PositionState {
  lat: number;
  lng: number;
}
interface MapComponentProps {
  position: PositionState;
  setPosition: React.Dispatch<React.SetStateAction<PositionState>>;
}
interface LocationPickerProps {
  setPosition: React.Dispatch<React.SetStateAction<PositionState>>;
}

// Fix for Leaflet's default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A helper component that listens for map clicks
function LocationPicker({ setPosition }: LocationPickerProps) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return null;
}

// The main Map component
export default function MapComponent({ position, setPosition }: MapComponentProps) {
  return (
    // --- THIS IS THE FIX ---
    // Add the style prop to make the map fill its container.
    <MapContainer center={position as L.LatLngExpression} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position as L.LatLngExpression}></Marker>
      <LocationPicker setPosition={setPosition} />
    </MapContainer>
  );
}
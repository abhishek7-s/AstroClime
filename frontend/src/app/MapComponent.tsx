'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- TypeScript Type Definitions ---
interface PositionState { lat: number; lng: number; }
interface MapComponentProps { position: PositionState; setPosition: React.Dispatch<React.SetStateAction<PositionState>>; }
interface LocationPickerProps { setPosition: React.Dispatch<React.SetStateAction<PositionState>>; }

// Fix for Leaflet's default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper component to handle map clicks
function LocationPicker({ setPosition }: LocationPickerProps) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return null;
}

// --- NEW: Helper component to automatically fly the map to a new position ---
function MapFlyToController({ position }: { position: PositionState }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, map.getZoom());
  }, [position, map]);
  return null;
}

// The main Map component
export default function MapComponent({ position, setPosition }: MapComponentProps) {
  return (
    <MapContainer center={position as L.LatLngExpression} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position as L.LatLngExpression}></Marker>
      <LocationPicker setPosition={setPosition} />
      <MapFlyToController position={position} />
    </MapContainer>
  );
}

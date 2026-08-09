import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Icon Leaflet Default
const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const customIcons = {
  Kost: L.icon({
    ...iconDefault.options,
    iconUrl: 'https://cdn.jsdelivr.net/npm/@mapbox/maki@6.2.0/icons/home-15.svg',
    iconSize: [32, 32],
    className: 'custom-marker kost-marker',
  }),
  Kontrakan: L.icon({
    ...iconDefault.options,
    iconUrl: 'https://cdn.jsdelivr.net/npm/@mapbox/maki@6.2.0/icons/building-15.svg',
    iconSize: [32, 32],
    className: 'custom-marker kontrakan-marker',
  }),
  default: iconDefault,
};

export const CITY_CENTERS = {
  Bandung: { lat: -6.9175, lng: 107.6191, zoom: 13 },
  Sukabumi: { lat: -6.9219, lng: 106.9281, zoom: 14 },
};

// ⚡ HELPER UNTUK KONTROL ANIMASI PERPINDAHAN PETA (FLYTO)
function MapController({ center, zoom, selectedProperty }) {
  const map = useMap();

  useEffect(() => {
    // Jika ada properti yang dipilih, fokuskan peta ke titik koordinat akuratnya
    if (selectedProperty && selectedProperty.lat && selectedProperty.lng) {
      map.flyTo([Number(selectedProperty.lat), Number(selectedProperty.lng)], 16, {
        animate: true,
        duration: 1.5,
      });
    } else if (center && center.lat && center.lng) {
      // Jika memilih kota (misal Sukabumi/Bandung), pindahkan peta ke pusat kota
      map.flyTo([Number(center.lat), Number(center.lng)], zoom || 13, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedProperty, center, zoom, map]);

  return null;
}

function MapEvents({ onBoundsChange, onClick }) {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      if (onBoundsChange) onBoundsChange(map.getBounds());
    },
    click: (e) => {
      if (onClick) onClick(e.latlng);
    },
  });
  return null;
}

function PropertyMarker({ property, onClick, isSelected }) {
  const Icon = customIcons[property.category] || customIcons.default;
  const lat = Number(property.lat);
  const lng = Number(property.lng);

  // Jangan tampilkan jika koordinat tidak valid
  if (isNaN(lat) || isNaN(lng)) return null;

  return (
    <Marker
      position={[lat, lng]}
      icon={Icon}
      eventHandlers={{
        click: () => onClick(property),
      }}
    >
      <Popup
        autoClose={false}
        closeButton={false}
        className={`property-popup ${isSelected ? 'selected' : ''}`}
      >
        <div className="p-2 min-w-[220px]">
          <img
            src={property.image || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80'}
            alt={property.title || property.name}
            className="w-full h-24 object-cover rounded-t-lg mb-2"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80';
            }}
          />
          <h4 className="font-bold text-[#2D2321] text-sm mb-1 line-clamp-1">
            {property.title || property.name}
          </h4>
          <p className="text-xs text-[#5C4A42] mb-1 line-clamp-1">📍 {property.location || property.address}</p>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold uppercase bg-[#FAF5EF] text-[#B38E5D] px-2 py-0.5 rounded border border-[#E5D7C5]">
              {property.category}
            </span>
            <span className="text-[10px] font-bold uppercase bg-[#FAF5EF] text-[#5C4A42] px-2 py-0.5 rounded border border-[#E5D7C5]">
              {property.gender}
            </span>
          </div>
          <p className="font-extrabold text-[#2D2321] text-sm mb-2">
            {property.price} <span className="font-normal text-[10px] text-gray-500">/{property.period || 'bulan'}</span>
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(property);
            }}
            className="w-full bg-[#261C19] hover:bg-[#C5A059] text-white text-[11px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition cursor-pointer"
          >
            Lihat Detail
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

export default function InteractiveMap({
  properties = [],
  selectedProperty = null,
  onPropertyClick = () => {},
  center = CITY_CENTERS.Bandung,
  zoom = 13,
  height = '500px',
  className = '',
}) {
  const [bounds, setBounds] = useState(null);

  // Filter hanya properti yang memiliki latitude & longitude valid
  const validProperties = properties.filter(
    (p) => p && !isNaN(Number(p.lat)) && !isNaN(Number(p.lng)) && Number(p.lat) !== 0
  );

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        zoomControl={true}
        scrollWheelZoom={true}
        className="w-full h-full rounded-3xl overflow-hidden border border-[#E5D7C5] shadow-xl"
        style={{ height: '100%' }}
      >
        {/* Layer Peta OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Controller untuk animasi perpindahan peta */}
        <MapController center={center} zoom={zoom} selectedProperty={selectedProperty} />

        <MapEvents onBoundsChange={(b) => setBounds(b)} />

        {/* Render Marker Semua Properti */}
        {validProperties.map((prop) => (
          <PropertyMarker
            key={prop.id}
            property={prop}
            onClick={onPropertyClick}
            isSelected={selectedProperty?.id === prop.id}
          />
        ))}

        {/* Marker Animasi Ping saat ada properti yang terpilih */}
        {selectedProperty && selectedProperty.lat && selectedProperty.lng && (
          <Marker
            position={[Number(selectedProperty.lat), Number(selectedProperty.lng)]}
            icon={L.divIcon({
              className: 'selected-marker',
              html: '<div class="pulse-ring"></div><div class="pulse-dot"></div>',
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            })}
          />
        )}
      </MapContainer>

      {/* STYLES */}
      <style jsx global>{`
        .property-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          padding: 0;
          overflow: hidden;
          border: 1px solid #e5d7c5;
        }
        .property-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .property-popup.selected .leaflet-popup-content-wrapper {
          border: 2px solid #c5a059;
        }
        .selected-marker .pulse-ring {
          width: 30px;
          height: 30px;
          border: 3px solid #c5a059;
          border-radius: 50%;
          animation: pulse 1.5s ease-out infinite;
        }
        .selected-marker .pulse-dot {
          width: 12px;
          height: 12px;
          background: #261c19;
          border: 2px solid #c5a059;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
"use client";

import dynamic from "next/dynamic"; 
import { Loader2 } from "lucide-react";
// Переконайтеся, що стилі Leaflet підключені (зазвичай у globals.css або тут)
import "leaflet/dist/leaflet.css"; 

// --- ТИП ДЛЯ ТОЧКИ ---
export interface MapMarker {
  lat: number;
  lng: number;
  label?: string; // Якщо label є - відображаємо підпис. Якщо немає - тільки точку.
  color?: 'red' | 'green' | 'blue'; // Колір маркера
}

const MapCore = dynamic(
  async () => {
    const { MapContainer, ImageOverlay, Marker, Tooltip, useMapEvents } = await import("react-leaflet");
    const L = await import("leaflet");

    // --- 1. ГЕНЕРАТОР ІКОНОК (Різні кольори) ---
    const createIcon = (color: string) => {
      // Визначаємо HEX коди кольорів
      const colors: Record<string, string> = {
        red: "#dc2626",   // Червоний (помилка)
        green: "#10b981", // Зелений (успіх)
        blue: "#2563eb",  // Синій (нейтральний/вибір)
      };

      const selectedColor = colors[color] || colors.blue;

      return L.divIcon({
        className: "bg-transparent",
        // Малюємо кружечок потрібного кольору з білою обводкою
        html: `<div style="
          width: 16px; 
          height: 16px; 
          background-color: ${selectedColor}; 
          border: 2px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8], // Центруємо іконку по координатах
      });
    };

    // --- 2. ОБРОБНИК КЛІКІВ ---
    const ClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
      useMapEvents({
        click(e) {
          onMapClick(e.latlng.lat, e.latlng.lng);
        },
      });
      return null;
    };

    // --- 3. ТІЛО КАРТИ ---
    return function Map({ 
      markers = [], 
      onPointSelect 
    }: { 
      markers: MapMarker[];
      onPointSelect?: (lat: number, lng: number) => void;
    }) {
      const bounds: [number, number][] = [[0, 0], [1000, 1000]];

      return (
        <MapContainer 
          crs={L.CRS.Simple} 
          bounds={bounds as any} 
          maxBounds={bounds as any}
          maxBoundsViscosity={1.0}
          center={[500, 500]} 
          zoom={0} 
          minZoom={-1}
          scrollWheelZoom={true} 
          style={{ height: "100%", width: "100%", background: "#f1f5f9" }}
        >
          <ImageOverlay
            url="/maps/greece.svg"
            bounds={bounds as any}
            opacity={1}
            zIndex={10}
          />

          {/* Дозволяємо клікати тільки якщо передана функція */}
          {onPointSelect && <ClickHandler onMapClick={onPointSelect} />}

          {/* Рендеримо маркери */}
          {markers.map((marker, idx) => (
            <Marker 
              key={idx}
              position={[marker.lat, marker.lng]} 
              icon={createIcon(marker.color || 'blue')} // Вибираємо колір
            >
              {/* Якщо є Label -> показуємо Tooltip. Якщо немає -> тільки точка */}
              {marker.label && (
                <Tooltip 
                  permanent // Текст видно завжди, без наведення
                  direction="top" 
                  offset={[0, -10]}
                  opacity={1}
                  className={`
                    font-bold text-xs px-2 py-1 rounded shadow-sm border border-slate-200
                    ${marker.color === 'green' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : ''}
                    ${marker.color === 'red' ? 'text-red-700 bg-red-50 border-red-200' : ''}
                    ${!marker.color || marker.color === 'blue' ? 'text-slate-700 bg-white' : ''}
                  `}
                >
                  {marker.label}
                </Tooltip>
              )}
            </Marker>
          ))}
        </MapContainer>
      );
    };
  },
  { 
    ssr: false, 
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">
        <Loader2 className="animate-spin h-8 w-8" />
        <span className="ml-2 font-bold">Φόρτωση χάρτη...</span>
      </div>
    )
  }
);

interface GreeceMapProps {
  markers?: MapMarker[]; 
  onSelect?: (coords: { lat: number; lng: number }) => void;
}

export default function GreeceMap({ markers = [], onSelect }: GreeceMapProps) {
  return (
    <div className="w-full h-full min-h-[500px] border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm relative z-0 bg-slate-50">
       <MapCore 
          markers={markers} 
          onPointSelect={onSelect ? (lat, lng) => onSelect({lat, lng}) : undefined} 
       />
    </div>
  );
}
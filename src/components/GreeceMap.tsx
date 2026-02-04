"use client";

import { useState } from "react";
import dynamic from "next/dynamic"; 
import { Loader2 } from "lucide-react";

// --- НОВИЙ ТИП ДЛЯ ТОЧКИ ---
export interface MapMarker {
  lat: number;
  lng: number;
  label?: string; // Назва точки (наприклад, "Афіни")
}

const MapCore = dynamic(
  async () => {
    // Додаємо Popup для відображення назв
    const { MapContainer, ImageOverlay, Marker, Popup, useMapEvents } = await import("react-leaflet");
    const L = await import("leaflet");

    // 1. Кастомний маркер
    const customIcon = L.divIcon({
      className: "bg-transparent",
      html: `<div style="width: 24px; height: 24px; background-color: #dc2626; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // 2. Обробник кліків
    const ClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
      useMapEvents({
        click(e) {
          onMapClick(e.latlng.lat, e.latlng.lng);
        },
      });
      return null;
    };

    // 3. Тіло карти (Приймає масив markers)
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
            eventHandlers={{
              error: (e) => console.error("ПОМИЛКА ЗАВАНТАЖЕННЯ КАРТИ:", e)
            }}
          />

          {/* Дозволяємо клікати тільки якщо передана функція onPointSelect */}
          {onPointSelect && <ClickHandler onMapClick={onPointSelect} />}

          {/* Рендеримо ВСІ маркери зі списку */}
          {markers.map((marker, idx) => (
            <Marker 
              key={idx}
              position={[marker.lat, marker.lng]} 
              icon={customIcon}
            >
              {marker.label && (
                <Popup autoClose={false} closeButton={false}>
                  <span className="font-bold text-slate-900 text-sm">{marker.label}</span>
                </Popup>
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
  markers?: MapMarker[]; // Тепер приймаємо масив
  onSelect?: (coords: { lat: number; lng: number }) => void;
}

export default function GreeceMap({ markers = [], onSelect }: GreeceMapProps) {
  // Ми прибрали внутрішній стан `point`, тепер карта повністю керована батьківським компонентом
  return (
    <div className="w-full h-[600px] border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm relative z-0 bg-slate-50">
       <MapCore 
          markers={markers} 
          onPointSelect={onSelect ? (lat, lng) => onSelect({lat, lng}) : undefined} 
       />
    </div>
  );
}
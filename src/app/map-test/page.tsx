"use client";

import { useState } from "react";
import GreeceMap from "@/components/shared/GreeceMap";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

export default function MapTestPage() {
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Кнопка назад */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-4 transition-colors">
            <ArrowLeft size={20} /> Πίσω στο Dashboard
          </Link>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <MapPin className="text-blue-600" />
            Тест Інтерактивної Карти
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Натисніть на будь-яку точку на карті (острів чи материк), щоб побачити, як система визначає координати.
          </p>
        </div>

        {/* --- КОМПОНЕНТ КАРТИ --- */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200">
          <GreeceMap onSelect={setCoords} />
        </div>

        {/* --- БЛОК РЕЗУЛЬТАТУ --- */}
        <div className="mt-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Координати (lat / lng)</h3>
                <div className="font-mono text-2xl font-black text-slate-800 tracking-tight">
                    {coords 
                        ? `${coords.lat.toFixed(1)} / ${coords.lng.toFixed(1)}` 
                        : "--- / ---"}
                </div>
            </div>
            
            {coords ? (
                <div className="px-6 py-3 bg-emerald-100 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-200">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"/>
                    Точку зафіксовано!
                </div>
            ) : (
                <div className="px-6 py-3 bg-slate-100 text-slate-400 rounded-xl text-sm font-bold border border-slate-200">
                    Очікування кліку...
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
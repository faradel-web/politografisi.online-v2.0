"use client";

import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from 'recharts';

interface SkillRadarProps {
  stats: {
    theory: number;
    readingWriting: number;
    listening: number;
    speaking: number;
  }
}

export default function SkillRadar({ stats }: SkillRadarProps) {
  // Назви категорій перекладені грецькою для консистентності
  const data = [
    { subject: 'Θεωρία', A: stats.theory, fullMark: 100 },
    { subject: 'Ανάγνωση/Γραφή', A: stats.readingWriting, fullMark: 100 },
    { subject: 'Ακουστική', A: stats.listening, fullMark: 100 },
    { subject: 'Ομιλία', A: stats.speaking, fullMark: 100 },
  ];

  const isEmpty = Object.values(stats).every(val => val === 0);

  if (isEmpty) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-slate-400 text-sm text-center p-4">
        <p>🎯 Δεν υπάρχουν δεδομένα</p>
        <p className="text-xs opacity-70 mt-1">Ολοκληρώστε την πρώτη σας εξέταση</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72 font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
          />
          
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          
          <Radar
            name="Επίδοση"
            dataKey="A"
            stroke="#8b5cf6" 
            strokeWidth={3}
            fill="#8b5cf6"
            fillOpacity={0.2}
            isAnimationActive={true}
          />
          
          <Tooltip 
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-sm">
                    <p className="font-bold text-slate-800 mb-1">{data.subject}</p>
                    <p className="text-purple-600 font-bold">
                      {Math.round(data.A)}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
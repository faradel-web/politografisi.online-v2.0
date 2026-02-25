"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

interface ProgressChartProps {
  data: {
    date: any; // Firestore Timestamp
    score: number;
    // Опціональні поля для сумісності, але основне - score
    percentage?: number; 
    totalQuestions?: number; 
  }[];
}

export default function ProgressChart({ data }: ProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-slate-400 text-sm">
        <p>📊 Δεν υπάρχουν δεδομένα</p>
        <p className="text-xs opacity-70">Ολοκληρώστε την πρώτη σας εξέταση</p>
      </div>
    );
  }

  // Готуємо дані
  const chartData = [...data]
    // Сортуємо за датою (від найстарішої до найновішої для графіка зліва направо)
    .sort((a, b) => {
        const timeA = a.date?.toMillis ? a.date.toMillis() : (a.date instanceof Date ? a.date.getTime() : 0);
        const timeB = b.date?.toMillis ? b.date.toMillis() : (b.date instanceof Date ? b.date.getTime() : 0);
        return timeA - timeB;
    })
    .map(item => {
      let dateLabel = '---';
      if (item.date?.toDate) {
         dateLabel = new Date(item.date.toDate()).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });
      } else if (item.date instanceof Date) {
         dateLabel = item.date.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });
      }

      return {
        date: dateLabel,
        score: item.score
      };
    });

  return (
    <div className="w-full h-72 font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
          
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          
          <YAxis 
            tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} 
            tickLine={false}
            axisLine={false}
            domain={[0, 100]} 
          />
          
          <Tooltip 
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-sm">
                    <p className="font-bold text-slate-800 mb-1 text-xs uppercase tracking-wide">{label}</p>
                    <p className="text-blue-600 font-black text-lg">
                      {data.score}/100
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#3b82f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorScore)" 
            activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#2563eb' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
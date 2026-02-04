"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Trophy, Clock, BarChart3, Radar, 
  Loader2, TrendingUp, Calendar, CheckCircle, XCircle, AlertTriangle
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"; 
import { useAuth } from "@/lib/auth-context"; 
import ProgressChart from "@/components/ProgressChart"; 
import SkillRadar from "@/components/SkillRadar"; 

// Тип для результату
type ExamResult = {
  id: string;
  date: any;
  score: number;
  percentage: number; 
  totalQuestions: number;
  isPassed: boolean;
  scores: {
      theory: number;
      reading: number;
      writing: number;
      listening: number;
      speaking: number;
      totalLang: number;
  };
};

export default function StatsPage() {
  const { user } = useAuth();

  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stats State
  const [stats, setStats] = useState({ 
    totalExams: 0, 
    averageScore: 0,
    successRate: 0 
  });
  
  // Radar Data
  const [skillStats, setSkillStats] = useState({
      theory: 0, 
      readingWriting: 0, 
      listening: 0, 
      speaking: 0
  });

  useEffect(() => {
    async function fetchStats() {
      if (!user) return; 

      try {
        const q = query(
            collection(db, "exam_results"), 
            where("userId", "==", user.uid), 
            orderBy("date", "desc"), 
            limit(50)
        );
        
        const snapshot = await getDocs(q);
        const fetchedResults: ExamResult[] = [];
        
        let totalScoreSum = 0;
        let passedCount = 0;
        let validExamsCount = 0;
        
        // Sums for Radar
        let totals = { theory: 0, rw: 0, list: 0, speak: 0 };
        let counts = { theory: 0, rw: 0, list: 0, speak: 0 };

        snapshot.forEach(doc => {
            const data = doc.data();
            
            // --- DATA NORMALIZATION ---
            let examScore = 0;
            let theoryScore = 0;
            let langScore = 0;
            let isPassed = false;
            
            let s_theory = 0, s_read = 0, s_write = 0, s_list = 0, s_speak = 0;

            if (data.scores) {
                s_theory = data.scores.theory || 0;
                s_read = data.scores.reading || 0;
                s_write = data.scores.writing || 0;
                s_list = data.scores.listening || 0;
                s_speak = data.scores.speaking || 0;
                
                langScore = data.scores.totalLang || (s_read + s_write + s_list + s_speak);
                examScore = s_theory + langScore; 
                isPassed = data.isPassed ?? (s_theory >= 20 && langScore >= 40);
            } else {
                examScore = data.score || 0;
                if (data.details) s_theory = data.details.theory || 0;
                isPassed = data.isPassed || (examScore >= 60);
            }

            const finalScore = Math.round(examScore);

            const result: ExamResult = {
                id: doc.id,
                date: data.date,
                score: finalScore,
                percentage: finalScore,
                totalQuestions: 100,
                isPassed: isPassed,
                scores: {
                    theory: Math.round(s_theory),
                    reading: s_read,
                    writing: s_write,
                    listening: s_list,
                    speaking: s_speak,
                    totalLang: Math.round(langScore)
                }
            };
            
            fetchedResults.push(result);
            
            totalScoreSum += result.score;
            if (isPassed) passedCount++;
            validExamsCount++;

            // --- RADAR CALCULATION ---
            totals.theory += (s_theory / 40) * 100; counts.theory++;
            const rwTotal = s_read + s_write;
            totals.rw += (rwTotal / 30) * 100; counts.rw++;
            totals.list += (s_list / 15) * 100; counts.list++;
            totals.speak += (s_speak / 15) * 100; counts.speak++;
        });

        setResults(fetchedResults);
        
        setStats({
            totalExams: snapshot.size, 
            averageScore: validExamsCount > 0 ? Math.round(totalScoreSum / validExamsCount) : 0,
            successRate: validExamsCount > 0 ? Math.round((passedCount / validExamsCount) * 100) : 0
        });

        const safeAvg = (total: number, count: number) => count > 0 ? Math.min(Math.round(total / count), 100) : 0;
        
        setSkillStats({
            theory: safeAvg(totals.theory, counts.theory),
            readingWriting: safeAvg(totals.rw, counts.rw),
            listening: safeAvg(totals.list, counts.list),
            speaking: safeAvg(totals.speak, counts.speak),
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin h-8 w-8 text-blue-600"/></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-20 shadow-sm/50 backdrop-blur-md bg-white/90">
         <div className="max-w-6xl mx-auto flex items-center gap-3 sm:gap-4">
            <Link href="/dashboard" className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-5 w-5"/>
            </Link>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 line-clamp-1">
                Αναλυτική Στατιστική
            </h1>
         </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        
        {/* 1. SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-3 sm:p-4 bg-blue-50 text-blue-600 rounded-2xl"><Trophy className="h-6 w-6 sm:h-8 sm:w-8"/></div>
                <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide">Μέσος Όρος</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.averageScore}/100</p>
                </div>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-3 sm:p-4 bg-purple-50 text-purple-600 rounded-2xl"><Clock className="h-6 w-6 sm:h-8 sm:w-8"/></div>
                <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide">Σύνολο Τεστ</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalExams}</p>
                </div>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-4">
                <div className={`p-3 sm:p-4 rounded-2xl ${stats.successRate >= 60 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8"/>
                </div>
                <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide">Επιτυχία</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.successRate}%</p>
                </div>
            </div>
        </div>

        {/* 2. CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Progress Chart */}
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200">
                <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wide mb-6 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600"/> Πορεία Επίδοσης (Τελευταία 10)
                </h2>
                <div className="h-64 sm:h-72 w-full"> 
                    <ProgressChart data={results.slice(0, 10).reverse()} />
                </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200">
                <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wide mb-6 flex items-center gap-2">
                    <Radar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600"/> Ανάλυση Δεξιοτήτων
                </h2>
                <div className="h-64 sm:h-72 w-full flex justify-center"> 
                    <SkillRadar stats={skillStats} />
                </div>
            </div>
        </div>

        {/* 3. HISTORY LIST (ADAPTIVE) */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 sm:p-8 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-slate-400"/> Ιστορικό Εξετάσεων
                </h2>
             </div>
             
             <div className="divide-y divide-slate-100">
                {results.length > 0 ? (
                    results.map((res) => {
                        const theoryPassed = res.scores.theory >= 20;
                        const langPassed = res.scores.totalLang >= 40;

                        return (
                            <Link 
                                key={res.id} 
                                href={`/dashboard/results/${res.id}`} 
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 hover:bg-slate-50 transition-colors group gap-4"
                            >
                                <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 
                                        ${res.isPassed ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                        {res.isPassed ? <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7"/> : <XCircle className="h-6 w-6 sm:h-7 sm:w-7"/>}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <p className="font-black text-slate-900 text-base sm:text-lg flex flex-wrap items-center gap-2">
                                            Εξέταση
                                            <span className="text-[10px] sm:text-xs font-normal text-slate-400 border border-slate-200 px-2 py-0.5 rounded-lg font-mono">
                                                {res.date?.toDate ? new Date(res.date.toDate()).toLocaleDateString('el-GR') : '---'}
                                            </span>
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold mt-2">
                                            <span className={`px-2 py-1 rounded-md border ${theoryPassed ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                Θεωρία: {res.scores.theory}/40
                                            </span>
                                            <span className={`px-2 py-1 rounded-md border ${langPassed ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                Γλώσσα: {res.scores.totalLang}/60
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Score - Full width on mobile, aligned end on desktop */}
                                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50 sm:gap-4">
                                    <div className="text-left sm:text-right">
                                        <p className="text-[10px] uppercase font-black text-slate-400">Σύνολο</p>
                                        <p className={`text-xl sm:text-2xl font-black ${res.isPassed ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {res.score}/100
                                        </p>
                                    </div>
                                    <div className={`p-2 rounded-full ${res.isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                                        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 rotate-180"/>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <div className="p-8 sm:p-12 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><AlertTriangle size={32}/></div>
                        <p className="text-slate-500 font-medium text-sm sm:text-base">Δεν βρέθηκαν αποτελέσματα. Ξεκινήστε το πρώτο σας τεστ!</p>
                        <Link href="/exam" className="text-blue-600 font-bold hover:underline">Έναρξη Εξέτασης</Link>
                    </div>
                )}
             </div>
        </div>

      </div>
    </div>
  );
}
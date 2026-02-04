"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, RotateCcw, UploadCloud, AlertCircle } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface AudioRecorderProps {
  onUploadComplete: (url: string) => void;
}

export default function AudioRecorder({ onUploadComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Таймер
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Очистка при демонтажі компонента
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startRecording = async () => {
    setError(null);
    setIsSuccess(false);
    
    try {
      // Запитуємо дозвіл на аудіо
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Створюємо Blob (webm краще підтримується браузерами ніж mp3 при запису)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Важливо: зупиняємо всі треки, щоб браузер "відпустив" мікрофон
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Запуск таймера
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Microphone access error:", err);
      // Обробка специфічних помилок
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Η πρόσβαση στο μικρόφωνο απορρίφθηκε. Ελέγξτε τις ρυθμίσεις του browser."); // Доступ заборонено
      } else if (err.name === 'NotFoundError') {
        setError("Δεν βρέθηκε μικρόφωνο."); // Мікрофон не знайдено
      } else {
        setError("Σφάλμα μικροφώνου: " + (err.message || "Άγνωστο σφάλμα"));
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    if (confirm("Θέλετε σίγουρα να διαγράψετε αυτή την εγγραφή;")) {
        setAudioBlob(null);
        setAudioUrl(null);
        setError(null);
        setIsSuccess(false);
        setDuration(0);
    }
  };

  const uploadRecording = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    setError(null);

    try {
      const filename = `speaking_answers/${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, audioBlob);
      const url = await getDownloadURL(storageRef);
      
      setIsSuccess(true);
      onUploadComplete(url); // Передаємо URL батьківському компоненту
      
    } catch (err) {
      console.error("Upload error:", err);
      setError("Σφάλμα κατά την αποθήκευση (Помилка завантаження).");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto p-4">
      
      {/* 1. Блок помилок */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200 w-full text-center animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0"/>
          <span>{error}</span>
        </div>
      )}

      {/* 2. Інтерфейс запису */}
      {!audioUrl ? (
        <div className="flex flex-col items-center gap-4">
            <div className={`text-4xl font-mono font-bold transition-colors ${isRecording ? "text-red-600" : "text-slate-300"}`}>
                {formatTime(duration)}
            </div>

            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${
                    isRecording 
                    ? "bg-red-500 hover:bg-red-600 animate-pulse ring-8 ring-red-100" 
                    : "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-blue-200"
                }`}
            >
                {isRecording ? (
                    <Square className="h-10 w-10 text-white fill-current" />
                ) : (
                    <Mic className="h-10 w-10 text-white" />
                )}
            </button>
            
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                {isRecording ? "Γίνεται εγγραφή..." : "Πατήστε για εγγραφή"}
            </p>
        </div>
      ) : (
        // 3. Інтерфейс передпрослуховування та збереження
        <div className="w-full space-y-4 animate-in zoom-in-95 duration-300">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Προεπισκόπηση</span>
                    <span className="text-xs font-mono font-bold text-slate-600">{formatTime(duration)}</span>
                </div>
                <audio src={audioUrl} controls className="w-full h-10 accent-blue-600" />
            </div>
            
            {!isSuccess ? (
                <div className="flex gap-3">
                    <button 
                        onClick={resetRecording}
                        className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center gap-2 transition-all"
                    >
                        <RotateCcw className="h-4 w-4"/> Ακύρωση
                    </button>
                    
                    <button 
                        onClick={uploadRecording}
                        disabled={isUploading}
                        className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-200 transition-all disabled:opacity-70"
                    >
                        {isUploading ? <Loader2 className="animate-spin h-5 w-5"/> : <UploadCloud className="h-5 w-5"/>}
                        Αποθήκευση Απάντησης
                    </button>
                </div>
            ) : (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-center font-bold flex items-center justify-center gap-2">
                    <UploadCloud className="h-5 w-5"/>
                    Το ηχητικό αποθηκεύτηκε!
                </div>
            )}
        </div>
      )}
    </div>
  );
}
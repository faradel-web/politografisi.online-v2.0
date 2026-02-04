"use client";

import { useState } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2, UploadCloud, CheckCircle, X } from "lucide-react";

interface FileUploadProps {
  // Важливо: називаємо проп саме так, як використовуємо в адмінці
  onUploadComplete: (url: string) => void; 
  folder?: string;
  label?: string;
  defaultUrl?: string;
}

export default function FileUpload({ 
  onUploadComplete, 
  folder = "uploads", 
  label = "Завантажити файл",
  defaultUrl 
}: FileUploadProps) {
  
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultUrl || null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Створюємо унікальне ім'я файлу
      const filename = `${folder}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filename);

      // Завантажуємо
      await uploadBytes(storageRef, file);
      
      // Отримуємо посилання
      const url = await getDownloadURL(storageRef);
      
      setPreview(url);
      onUploadComplete(url);
      
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Помилка завантаження файлу");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete(""); // Очищаємо URL у батьківському компоненті
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label}
      </label>

      {!preview ? (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
               <>
                 <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                 <p className="text-sm text-gray-500">Завантаження...</p>
               </>
            ) : (
               <>
                 <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                 <p className="text-sm text-gray-500 font-medium">Натисніть для вибору файлу</p>
                 <p className="text-xs text-gray-400">PNG, JPG, MP3 (до 10MB)</p>
               </>
            )}
          </div>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleUpload} 
            disabled={isUploading}
            accept="image/*,audio/*"
          />
        </label>
      ) : (
        <div className="relative group w-full h-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
            {/* Якщо це картинка */}
            {preview.includes(".jpg") || preview.includes(".png") || preview.includes(".jpeg") || preview.includes("googleusercontent") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="uploaded" className="w-full h-full object-cover" />
            ) : (
                <div className="flex items-center gap-2 text-green-600 font-bold">
                    <CheckCircle className="h-6 w-6"/> Файл завантажено
                </div>
            )}
            
            {/* Кнопка видалення */}
            <button 
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-gray-600 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="h-4 w-4"/>
            </button>
        </div>
      )}
    </div>
  );
}
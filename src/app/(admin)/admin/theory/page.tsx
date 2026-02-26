"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic"; 
import { db, storage } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  Save, Loader2, ArrowLeft, Plus, Trash2, FileText, 
  Video, Bot, Edit3, X, Book, AlertCircle, CheckCircle, Music, UploadCloud, Paperclip, FileJson, FileType, Link as LinkIcon, Presentation, GripVertical
} from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from "next/link";
import mammoth from "mammoth"; 

import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false }) as any;

// --- TYPES ---
interface Attachment {
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'other';
  path: string;
}

interface Lesson {
  id: string;
  order: number;
  title: string;
  content: string;
  videoUrl: string;
  audioUrl?: string; 
  presentationUrl?: string; // 🔥 НОВЕ ПОЛЕ ДЛЯ PPTX
  attachments?: Attachment[];
  category: string;
  isPublished?: boolean;
}

interface KnowledgeSource {
  name: string;
  type: 'pdf' | 'json' | 'text' | 'docx' | 'gdoc';
  size: number;
  addedAt: any;
  url?: string | null;
}

const CATEGORIES = [
  { id: "history", label: "Ιστορία (Історія)" },
  { id: "politics", label: "Πολιτική (Πολιтика)" },
  { id: "geography", label: "Γεωγραφία (Географія)" },
  { id: "culture", label: "Πολιτισμός (Культура)" },
  { id: "reading", label: "Ανάγνωση (Читання)" },
  { id: "listening", label: "Ακρόαση (Аудіювання)" },
  { id: "speaking", label: "Προφορικά (Говоріння)" },
];

export default function AdminTheoryGlobal() {
  const [selectedCat, setSelectedCat] = useState("history");
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLessonLoading, setIsLessonLoading] = useState(true);
  
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Partial<Lesson>>({});
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  
  // File States
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [presentationFile, setPresentationFile] = useState<File | null>(null); // 🔥 НОВИЙ STATE
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // AI KNOWLEDGE BASE STATE
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [totalContextSize, setTotalContextSize] = useState(0);
  const [isProcessingSource, setIsProcessingSource] = useState(false);
  
  // Google Doc Modal
  const [isGDocModalOpen, setIsGDocModalOpen] = useState(false);
  const [gDocLink, setGDocLink] = useState("");
  const [gDocText, setGDocText] = useState("");

  useEffect(() => {
    loadLessons();
    loadKnowledgeBase();
  }, [selectedCat]);

  async function loadLessons() {
    setIsLessonLoading(true);
    try {
      const q = query(
        collection(db, "theory_content"), 
        where("category", "==", selectedCat)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Lesson))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setLessons(data);
    } catch (e) { console.error(e); }
    finally { setIsLessonLoading(false); }
  }

  async function loadKnowledgeBase() {
    try {
      const docRef = doc(db, "theory_knowledge_base", selectedCat);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setTotalContextSize((data.text || "").length);
        setKnowledgeSources(data.sources || []);
      } else {
        setTotalContextSize(0);
        setKnowledgeSources([]);
      }
    } catch (e) { console.error(e); }
  }

  // --- УНІВЕРСАЛЬНИЙ ОБРОБНИК ЗАВАНТАЖЕННЯ ДЛЯ AI ---
  const handleKnowledgeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024 && file.type !== 'application/pdf') {
        alert("Το αρχείο είναι πολύ μεγάλο.");
        return;
    }

    setIsProcessingSource(true);
    let extractedText = "";
    let fileType: KnowledgeSource['type'] = 'text';

    try {
      // 1. PDF
      if (file.type === 'application/pdf') {
          fileType = 'pdf';
          const pdfjs = await import('pdfjs-dist/build/pdf');
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const maxPages = Math.min(pdf.numPages, 50); 
          for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            // @ts-ignore
            const str = content.items.map((item: any) => item.str).join(" ");
            extractedText += `\n[PDF Page ${i}]: ${str}`;
          }
      } 
      // 2. WORD
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          fileType = 'docx';
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
          extractedText = `\n[DOCX DOCUMENT]: ${result.value}`;
      }
      // 3. JSON
      else if (file.type === 'application/json') {
          fileType = 'json';
          const text = await file.text();
          const json = JSON.parse(text);
          extractedText = `\n[JSON DATA]: ${JSON.stringify(json, null, 2)}`;
      }
      // 4. TEXT
      else if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
          fileType = 'text';
          extractedText = `\n[TEXT DOCUMENT]: ${await file.text()}`;
      }
      else {
          throw new Error("Μη υποστηριζόμενος τύπος αρχείου");
      }

      if (extractedText.length < 5) throw new Error("Το αρχείο είναι άδειο.");

      await saveSourceToDB(file.name, fileType, file.size, extractedText);
      alert(`Προστέθηκε: ${file.name}`);

    } catch (error: any) {
      console.error(error);
      alert(`Σφάλμα: ${error.message}`);
    } finally {
      setIsProcessingSource(false);
      e.target.value = "";
    }
  };

  const handleGDocSave = async () => {
      if (!gDocLink || !gDocText) return alert("Заповніть посилання та текст!");
      setIsProcessingSource(true);
      try {
          const formattedText = `\n[GOOGLE DOC LINK: ${gDocLink}]\nCONTENT: ${gDocText}`;
          await saveSourceToDB("Google Doc (Glossary)", "gdoc", gDocText.length, formattedText, gDocLink);
          setIsGDocModalOpen(false);
          setGDocLink("");
          setGDocText("");
      } catch (e) { console.error(e); alert("Error saving G-Doc"); }
      finally { setIsProcessingSource(false); }
  };

  const saveSourceToDB = async (name: string, type: KnowledgeSource['type'], size: number, textContent: string, url?: string) => {
      const docRef = doc(db, "theory_knowledge_base", selectedCat);
      const docSnap = await getDoc(docRef);
      
      let currentText = docSnap.exists() ? docSnap.data().text : "";
      let currentSources = docSnap.exists() ? (docSnap.data().sources || []) : [];

      const newText = currentText + "\n\n--- NEW SOURCE: " + name + " ---\n" + textContent;
      
      const newSource: KnowledgeSource = {
          name: name,
          type: type,
          size: size,
          addedAt: new Date().toISOString(),
          url: url || null 
      };
      const newSources = [...currentSources, newSource];

      await setDoc(docRef, {
          text: newText,
          sources: newSources,
          lastUpdated: serverTimestamp()
      }, { merge: true });

      setTotalContextSize(newText.length);
      setKnowledgeSources(newSources);
  };

  const handleClearKnowledgeBase = async () => {
      if (!confirm("Είστε σίγουροι; Αυτό θα διαγράψει όλη τη 'μνήμη' του AI για αυτή την κατηγορία.")) return;
      
      const docRef = doc(db, "theory_knowledge_base", selectedCat);
      await setDoc(docRef, { text: "", sources: [], lastUpdated: serverTimestamp() });
      setTotalContextSize(0);
      setKnowledgeSources([]);
  };

  // --- ЛОГІКА УРОКІВ (ATTACHMENTS & SAVE) ---
  const handleUploadAttachment = async () => {
      if (!attachmentFile) return;
      setIsUploadingAttachment(true);
      try {
          const filePath = `theory_attachments/${Date.now()}_${attachmentFile.name}`;
          const storageRef = ref(storage, filePath);
          await uploadBytes(storageRef, attachmentFile);
          const url = await getDownloadURL(storageRef);

          const newAttachment: Attachment = {
              name: attachmentFile.name,
              url: url,
              type: attachmentFile.name.endsWith('.pdf') ? 'pdf' : 'other',
              path: filePath
          };

          setCurrentLesson(prev => ({
              ...prev,
              attachments: [...(prev.attachments || []), newAttachment]
          }));
          setAttachmentFile(null);
      } catch (e) { alert("Σφάλμα μεταφόρτωσης αρχείου"); console.error(e); }
      finally { setIsUploadingAttachment(false); }
  };

  const removeAttachment = (index: number) => {
      const newAttachments = [...(currentLesson.attachments || [])];
      newAttachments.splice(index, 1);
      setCurrentLesson({ ...currentLesson, attachments: newAttachments });
  };

  const handleSaveLesson = async () => {
    if (!currentLesson.title) return alert("Παρακαλώ εισάγετε τίτλο μαθήματος");
    setIsSavingLesson(true);
    
    try {
      let finalAudioUrl = currentLesson.audioUrl || "";
      let finalPresentationUrl = currentLesson.presentationUrl || "";

      // 1. Upload Audio if new
      if (audioFile) {
          const storageRef = ref(storage, `theory_audio/${Date.now()}_${audioFile.name}`);
          await uploadBytes(storageRef, audioFile);
          finalAudioUrl = await getDownloadURL(storageRef);
      }

      // 2. Upload Presentation if new
      if (presentationFile) {
          const storageRef = ref(storage, `theory_presentations/${Date.now()}_${presentationFile.name}`);
          await uploadBytes(storageRef, presentationFile);
          finalPresentationUrl = await getDownloadURL(storageRef);
      }

      const payload = {
        category: selectedCat,
        title: currentLesson.title,
        content: currentLesson.content || "",
        videoUrl: currentLesson.videoUrl || "",
        audioUrl: finalAudioUrl,
        presentationUrl: finalPresentationUrl, // 🔥 ЗБЕРЕЖЕННЯ URL
        attachments: currentLesson.attachments || [],
        order: currentLesson.order || lessons.length + 1,
        isPublished: currentLesson.isPublished ?? true,
        updatedAt: serverTimestamp()
      };

      if (currentLesson.id) {
        await updateDoc(doc(db, "theory_content", currentLesson.id), payload);
      } else {
        await addDoc(collection(db, "theory_content"), payload);
      }
      
      setIsEditingLesson(false);
      setCurrentLesson({});
      setAudioFile(null);
      setPresentationFile(null);
      setAttachmentFile(null);
      await loadLessons();
    } catch (e) { alert("Σφάλμα αποθήκευσης: " + e); }
    finally { setIsSavingLesson(false); }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Διαγραφή μαθήματος;")) return;
    try {
        await deleteDoc(doc(db, "theory_content", id));
        await loadLessons();
    } catch (error) {
        alert("Помилка видалення: " + error);
    }
  };

  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
       const oldIndex = lessons.findIndex(l => l.id === active.id);
       const newIndex = lessons.findIndex(l => l.id === over.id);
       const newLessons = arrayMove(lessons, oldIndex, newIndex);
       
       setLessons(newLessons.map((l, index) => ({...l, order: index + 1})));

       try {
           const updatePromises = newLessons.map((l, index) => {
                if (l.order !== index + 1) {
                    return updateDoc(doc(db, "theory_content", l.id), { order: index + 1 });
                }
                return null;
           }).filter(Boolean);
           await Promise.all(updatePromises);
       } catch(e) { console.error(e) } finally { loadLessons(); }
    }
  }

  const SortableLesson = ({ lesson, onEdit, onDelete }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lesson.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    
    return (
        <div ref={setNodeRef} style={style} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all mb-3 relative z-10 bg-opacity-100">
            <div className="flex items-center gap-4">
                <button {...attributes} {...listeners} className="p-2 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing hover:bg-slate-50 rounded-lg"><GripVertical size={20}/></button>
                <span className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-sm shrink-0">#{lesson.order}</span>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">{lesson.title}</h3>
                        {lesson.isPublished === false && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Προσχέδιο</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-400">
                        {lesson.videoUrl && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 flex items-center gap-1"><Video size={10}/> Video</span>}
                        {lesson.audioUrl && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-100 flex items-center gap-1"><Music size={10}/> Audio</span>}
                        {lesson.presentationUrl && <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded border border-orange-100 flex items-center gap-1"><Presentation size={10}/> PPTX</span>}
                        {lesson.attachments && lesson.attachments.length > 0 && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 flex items-center gap-1"><Paperclip size={10}/> {lesson.attachments.length} Files</span>}
                    </div>
                </div>
            </div>
            <div className="flex gap-2 shrink-0">
                <button onClick={() => onEdit(lesson)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit3 size={18}/></button>
                <button onClick={() => onDelete(lesson.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={18}/></button>
            </div>
        </div>
    );
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 sticky top-4 z-20">
             <div className="flex items-center gap-4">
                <Link href="/admin" className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                    <ArrowLeft size={20}/>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Διαχείριση Ενότητας</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">LMS & Knowledge Sources</p>
                </div>
            </div>
            
            <select 
                value={selectedCat} 
                onChange={(e) => { setSelectedCat(e.target.value); setIsEditingLesson(false); }}
                className="p-3 bg-blue-50 text-blue-800 font-bold rounded-xl border border-blue-100 outline-none cursor-pointer"
            >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
            
            {/* LEFT SIDEBAR: AI KNOWLEDGE BASE */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-indigo-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/10 rounded-lg"><Bot className="h-6 w-6 text-indigo-200"/></div>
                            <h2 className="font-bold text-lg">Πηγές Γνώσης AI</h2>
                        </div>
                        <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                            Προσθέστε αρχεία (Word, PDF, JSON) ή συνδέσμους Google Docs. Το AI θα συνδυάσει όλη τη γνώση.
                        </p>

                        {/* STATUS */}
                        <div className="bg-indigo-800/50 rounded-xl p-4 border border-indigo-700 mb-6">
                            <div className="text-xs font-bold text-indigo-300 uppercase mb-2">Κατάσταση Μνήμης</div>
                            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                                <Bot size={18}/>
                                <span>{totalContextSize.toLocaleString()} χαρακτήρες</span>
                            </div>
                            <div className="text-[10px] text-indigo-400 mb-3">
                                {knowledgeSources.length} ενεργές πηγές
                            </div>
                            
                            {/* SOURCES LIST */}
                            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                {knowledgeSources.map((src, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[10px] text-indigo-100 bg-indigo-950/30 p-1.5 rounded border border-indigo-500/30">
                                        {src.type === 'pdf' && <FileText size={10}/>}
                                        {src.type === 'docx' && <FileText size={10} className="text-blue-300"/>}
                                        {src.type === 'json' && <FileJson size={10} className="text-yellow-300"/>}
                                        {src.type === 'text' && <FileType size={10}/>}
                                        {src.type === 'gdoc' && <LinkIcon size={10} className="text-green-300"/>}
                                        <span className="truncate flex-1">{src.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* UPLOAD BUTTONS */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* FILE UPLOAD */}
                             <label className={`col-span-1 py-3 bg-white text-indigo-900 font-bold text-xs text-center rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center gap-1 ${isProcessingSource ? 'opacity-50 pointer-events-none' : ''}`}>
                                {isProcessingSource ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16}/>}
                                Upload File
                                <span className="text-[8px] opacity-60">DOCX, PDF, JSON</span>
                                <input 
                                    type="file" 
                                    accept=".pdf,.json,.txt,.md,.docx" 
                                    className="hidden" 
                                    onChange={handleKnowledgeUpload} 
                                    disabled={isProcessingSource}
                                />
                            </label>
                            
                            {/* GOOGLE DOC BTN */}
                            <button 
                                onClick={() => setIsGDocModalOpen(true)}
                                className="col-span-1 py-3 bg-indigo-700 text-white font-bold text-xs rounded-xl hover:bg-indigo-600 transition-colors flex flex-col items-center justify-center gap-1 border border-indigo-600"
                            >
                                <LinkIcon size={16}/>
                                Google Doc
                                <span className="text-[8px] opacity-60">Link + Text</span>
                            </button>
                            
                            <button 
                                onClick={handleClearKnowledgeBase}
                                className="col-span-2 py-2 text-indigo-300 text-xs hover:text-white transition-colors underline decoration-indigo-700 mt-2"
                            >
                                Καθαρισμός Βάσης
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT: LESSONS (8 cols) */}
            <div className="lg:col-span-8">
                {!isEditingLesson ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-xl font-black text-slate-800">Λίστα Μαθημάτων</h2>
                            <button onClick={() => { setCurrentLesson({ order: lessons.length + 1 }); setAudioFile(null); setPresentationFile(null); setAttachmentFile(null); setIsEditingLesson(true); }} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg text-sm">
                                <Plus size={16}/> Νέο Μάθημα
                            </button>
                        </div>

                        {isLessonLoading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-500"/></div> : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                    <div className="grid gap-0">
                                        {lessons.map((l) => (
                                            <SortableLesson key={l.id} lesson={l} onEdit={(lesson: any) => { setCurrentLesson(lesson); setAudioFile(null); setPresentationFile(null); setAttachmentFile(null); setIsEditingLesson(true); }} onDelete={handleDeleteLesson} />
                                        ))}
                                        {lessons.length === 0 && <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-400 font-medium">Δεν υπάρχουν μαθήματα. Πατήστε "Νέο Μάθημα".</div>}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4 relative overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-900">{currentLesson.id ? "Επεξεργασία Μαθήματος" : "Δημιουργία Μαθήματος"}</h2>
                            <button onClick={() => setIsEditingLesson(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
                        </div>

                        <div className="p-8 space-y-8">
                            
                            {/* BLOCK 1: MAIN INFO */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={14}/> Βασικές Πληροφορίες</h3>
                                <div className="grid grid-cols-6 gap-4">
                                    <div className="col-span-4 space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Τίτλος Μαθήματος</label>
                                        <input 
                                            value={currentLesson.title || ""} 
                                            onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                                            placeholder="Εισάγετε τίτλο..."
                                        />
                                    </div>
                                    <div className="col-span-1 space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Α/Α</label>
                                        <input 
                                            type="number"
                                            value={currentLesson.order || 0} 
                                            onChange={e => setCurrentLesson({...currentLesson, order: Number(e.target.value)})}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none text-center focus:ring-2 focus:ring-blue-100" 
                                        />
                                    </div>
                                    <div className="col-span-1 space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Κατάσταση</label>
                                        <button 
                                            onClick={() => setCurrentLesson({...currentLesson, isPublished: currentLesson.isPublished === false ? true : false})}
                                            className={`w-full p-4 rounded-xl font-bold transition-all text-xs ${currentLesson.isPublished !== false ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}
                                        >
                                            {currentLesson.isPublished !== false ? "Ορατό" : "Draft"}
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* BLOCK 2: MEDIA */}
                            <section className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Video size={14}/> Πολυμέσα (Media)</h3>
                                
                                {/* Video */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Βίντεο (YouTube Embed Link)</label>
                                    <input 
                                        value={currentLesson.videoUrl || ""} 
                                        onChange={e => setCurrentLesson({...currentLesson, videoUrl: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none text-sm focus:border-blue-300" 
                                        placeholder="https://www.youtube.com/embed/..."
                                    />
                                </div>

                                {/* Audio */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ήχος (Podcast)</label>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        {currentLesson.audioUrl && (
                                            <audio controls src={currentLesson.audioUrl} className="h-8 w-64" />
                                        )}
                                        <div className="flex-1"></div>
                                        {audioFile && <span className="text-xs text-emerald-600 font-bold px-2 bg-emerald-50 rounded border border-emerald-100">{audioFile.name}</span>}
                                        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-purple-300 text-slate-600 hover:text-purple-600 rounded-lg cursor-pointer transition-all text-sm font-bold shadow-sm">
                                            <UploadCloud size={16}/>
                                            {audioFile ? "Αλλαγή αρχείου" : "Μεταφόρτωση MP3"}
                                            <input type="file" accept="audio/*" className="hidden" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                </div>

                                {/* 🔥 PRESENTATION PPTX (NEW) */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Παρουσίαση (PPTX)</label>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        {currentLesson.presentationUrl && (
                                            <a href={currentLesson.presentationUrl} target="_blank" className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
                                                <Presentation size={14}/>
                                                View Saved PPTX
                                            </a>
                                        )}
                                        <div className="flex-1"></div>
                                        {presentationFile && <span className="text-xs text-orange-600 font-bold px-2 bg-orange-50 rounded border border-orange-100">{presentationFile.name}</span>}
                                        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-orange-300 text-slate-600 hover:text-orange-600 rounded-lg cursor-pointer transition-all text-sm font-bold shadow-sm">
                                            <UploadCloud size={16}/>
                                            {presentationFile ? "Αλλαγή αρχείου" : "Upload PPTX"}
                                            <input type="file" accept=".pptx" className="hidden" onChange={e => setPresentationFile(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                </div>

                            </section>

                            {/* BLOCK 3: CONTENT (RICH TEXT) */}
                            <section className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Edit3 size={14}/> Σημειώσεις & Γλωσσάρι</h3>
                                <div className="bg-white rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 ring-blue-100 transition-all">
                                    <ReactQuill 
                                        theme="snow"
                                        value={currentLesson.content || ""}
                                        onChange={(value: string) => setCurrentLesson({...currentLesson, content: value})}
                                        modules={quillModules}
                                        className="h-80 mb-12" 
                                    />
                                </div>
                            </section>

                            {/* BLOCK 4: ATTACHMENTS */}
                            <section className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Paperclip size={14}/> Αρχεία για Λήψη</h3>
                                
                                {/* Upload Area */}
                                <div className="flex gap-2">
                                    <input 
                                        type="file" 
                                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                        onChange={e => setAttachmentFile(e.target.files?.[0] || null)}
                                    />
                                    <button 
                                        onClick={handleUploadAttachment} 
                                        disabled={!attachmentFile || isUploadingAttachment}
                                        className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                                    >
                                        {isUploadingAttachment ? "..." : "Προσθήκη"}
                                    </button>
                                </div>

                                {/* List */}
                                <div className="space-y-2">
                                    {currentLesson.attachments?.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                            <div className="flex items-center gap-2 text-sm font-medium text-blue-800 truncate">
                                                <FileText size={16}/> {file.name}
                                            </div>
                                            <button onClick={() => removeAttachment(idx)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* FOOTER ACTIONS */}
                            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                                <button onClick={() => setIsEditingLesson(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">Ακύρωση</button>
                                <button onClick={handleSaveLesson} disabled={isSavingLesson} className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-8 py-3 rounded-xl font-black shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center gap-2">
                                    {isSavingLesson ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                    Αποθήκευση
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* GOOGLE DOC MODAL */}
        {isGDocModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><LinkIcon size={20}/> Google Doc Link</h3>
                        <button onClick={() => setIsGDocModalOpen(false)}><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">1. Link (URL)</label>
                        <input 
                            value={gDocLink}
                            onChange={(e) => setGDocLink(e.target.value)}
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
                            placeholder="https://docs.google.com/..."
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">2. Content (Paste Text)</label>
                        <p className="text-[10px] text-orange-500 mb-1">AI δεν μπορεί να διαβάσει ιδιωτικά links. Αντιγράψτε το κείμενο εδώ:</p>
                        <textarea 
                            value={gDocText}
                            onChange={(e) => setGDocText(e.target.value)}
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm h-32"
                            placeholder="Paste text content from the Google Doc here..."
                        />
                    </div>

                    <button 
                        onClick={handleGDocSave}
                        disabled={isProcessingSource}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isProcessingSource ? "Saving..." : "Add to Knowledge Base"}
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
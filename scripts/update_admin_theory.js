const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/(admin)/admin/theory/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(
  /Music, UploadCloud, Paperclip, FileJson, FileType, Link as LinkIcon, Presentation\n} from "lucide-react";/g,
  `Music, UploadCloud, Paperclip, FileJson, FileType, Link as LinkIcon, Presentation, GripVertical\n} from "lucide-react";\nimport { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';\nimport { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';\nimport { useSortable } from '@dnd-kit/sortable';\nimport { CSS } from '@dnd-kit/utilities';`
);

// 2. Interface Lesson
content = content.replace(
  /category: string;\n}/g,
  `category: string;\n  isPublished?: boolean;\n}`
);

// 3. Payload Add inside handleSaveLesson
content = content.replace(
  /order: currentLesson.order \|\| lessons.length \+ 1,\n\s*updatedAt: serverTimestamp\(\)\n\s*};\n\n\s*if \(currentLesson.id\)/g,
  `order: currentLesson.order || lessons.length + 1,\n        isPublished: currentLesson.isPublished ?? true,\n        updatedAt: serverTimestamp()\n      };\n\n      if (currentLesson.id)`
);

// 4. Form inputs (Title, Order, isPublished)
content = content.replace(
  /<div className="grid grid-cols-6 gap-4">\n\s*<div className="col-span-5 space-y-2">[\s\S]*?<div className="col-span-1 space-y-2">[\s\S]*?<\/div>\n\s*<\/div>/g,
  `<div className="grid grid-cols-6 gap-4">
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
                                            className={\`w-full p-4 rounded-xl font-bold transition-all text-xs \${currentLesson.isPublished !== false ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}\`}
                                        >
                                            {currentLesson.isPublished !== false ? "Ορατό" : "Draft"}
                                        </button>
                                    </div>
                                </div>`
);

// 5. Sensors and handleDragEnd inside AdminTheoryGlobal, plus SortableLesson component
const dndFunctions = `
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

  const quillModules = {`;

content = content.replace(/const quillModules = \{/, dndFunctions);

// 6. Update List Render
content = content.replace(
  /<div className="grid gap-3">\n\s*\{lessons.map\(\(l\) => \([\s\S]*?<\/div>[\s\S]*?\)\}\n\s*\{lessons.length === 0 && <div className="text-center py-16 bg-white rounded-\[2rem\] border border-dashed border-slate-200 text-slate-400 font-medium">Δεν υπάρχουν μαθήματα. Πατήστε "Νέο Μάθημα".<\/div>\}\n\s*<\/div>/g,
  `<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                    <div className="grid gap-0">
                                        {lessons.map((l) => (
                                            <SortableLesson key={l.id} lesson={l} onEdit={(lesson: any) => { setCurrentLesson(lesson); setAudioFile(null); setPresentationFile(null); setAttachmentFile(null); setIsEditingLesson(true); }} onDelete={handleDeleteLesson} />
                                        ))}
                                        {lessons.length === 0 && <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-400 font-medium">Δεν υπάρχουν μαθήματα. Πατήστε "Νέο Μάθημα".</div>}
                                    </div>
                                </SortableContext>
                            </DndContext>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Admin Update complete');

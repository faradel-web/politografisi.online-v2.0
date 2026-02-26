const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/(dashboard)/theory/[category]/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Target imports
content = content.replace(
  /Music, Download, File, X, Presentation\n} from "lucide-react";/g,
  `Music, Download, File, X, Presentation, Menu, ArrowRight\n} from "lucide-react";`
);
content = content.replace(
  /import ReactMarkdown from 'react-markdown';/g,
  `import ReactMarkdown from 'react-markdown';\nimport remarkGfm from 'remark-gfm';`
);

// 2. Add UI STATE
content = content.replace(
  /\/\/ STATE: ДАНІ\n  const \[lessons, setLessons\]/g,
  `// UI STATE
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight > clientHeight) {
      setScrollProgress((scrollTop / (scrollHeight - clientHeight)) * 100);
    }
  };

  // STATE: ДАНІ
  const [lessons, setLessons]`
);

// 3. Update Header
content = content.replace(
  /<div className="flex items-center gap-3 md:gap-4">\n\s*<Link href={`\/theory`} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">\n\s*<ArrowLeft className="h-5 w-5" \/>\n\s*<\/Link>\n\s*<div className="flex flex-col md:flex-row md:items-center md:gap-2">/g,
  `<div className="flex items-center gap-2 md:gap-4">
          <Link href={\`/theory\`} className="hidden md:flex p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:gap-2 md:border-l md:border-slate-200 md:pl-4 pl-2">`
);

// 4. Update Main Content Layout (Sidebar & Main content wrap)
content = content.replace(
  /{{\/\* --- MAIN CONTENT LAYOUT --- \*\/}}.*\n\s*<div className="flex-1 flex overflow-hidden relative">\n\n\s*{{\/\* LEFT PANEL: LESSON CONTENT \*\/}}\n\s*<div className=\{`flex-1 flex flex-col transition-all duration-300 w-full \${isChatOpen \? 'lg:mr-\[400px\]' : ''}`\}>\n\n\s*{{\/\* LESSONS NAV \(SCROLLABLE\) \*\/}}\n\s*<div className="h-14 border-b border-slate-100 flex items-center px-4 gap-2 overflow-x-auto bg-slate-50\/50 shrink-0 scrollbar-hide">[\s\S]*?<\/div>\n\n\s*{{\/\* ACTIVE LESSON VIEW \*\/}}\n\s*<div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar bg-white">/g,
  `{/* --- MAIN CONTENT LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT SIDEBAR (DRAWER) */}
        {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}
        
        <div className={\`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 \${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shrink-0\`}>
           <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
             <span className="font-bold text-slate-800 text-sm tracking-wide uppercase">Μαθήματα ({lessons.length})</span>
             <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X size={18}/></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
             {lessons.length > 0 ? (
               lessons.map(l => (
                 <button
                   key={l.id}
                   onClick={() => { setActiveLesson(l); setIsSidebarOpen(false); }}
                   className={\`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all block \${
                       activeLesson?.id === l.id 
                       ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                       : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-100'
                   }\`}
                 >
                   {l.order}. {l.title}
                 </button>
               ))
             ) : (
                <div className="text-xs text-slate-400 italic text-center mt-10">Δεν υπάρχουν μαθήματα.</div>
             )}
           </div>
        </div>

        {/* LEFT PANEL: LESSON CONTENT */}
        <div className={\`flex-1 flex flex-col transition-all duration-300 min-w-0 \${isChatOpen ? 'lg:mr-[400px]' : ''}\`}>
          
          {/* PROGRESS BAR */}
          <div className="h-1 w-full bg-slate-100 shrink-0">
            <div className="h-full bg-blue-500 transition-all duration-150 ease-out" style={{ width: \`\${scrollProgress}%\` }}></div>
          </div>

          {/* ACTIVE LESSON VIEW */}
          <div onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar bg-white scroll-smooth relative">`
);

// 5. Add "Next Lesson ->"
content = content.replace(
  /<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\) : \(\n\s*<div className="flex/g,
  `</button>
                  </div>
                </div>

                {/* NEXT LESSON BUTTON */}
                {(() => {
                  const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
                  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
                  if (nextLesson) {
                    return (
                      <div className="mt-12 flex justify-end border-t border-slate-100 pt-8">
                        <button 
                          onClick={() => {
                            setActiveLesson(nextLesson); 
                            document.querySelector('.custom-scrollbar')?.scrollTo({top: 0, behavior: 'smooth'});
                          }} 
                          className="group flex flex-col items-end text-right hover:-translate-y-1 transition-transform"
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Επόμενο Μάθημα</span>
                          <span className="flex items-center gap-3 text-lg font-black text-blue-600 group-hover:text-blue-700">
                            {nextLesson.title} <ArrowRight className="w-5 h-5 bg-blue-100 rounded-full p-0.5" />
                          </span>
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

              </div>
            ) : (
              <div className="flex`
);

// 6. Update AI Chat UI (Glassmorphism & remark-gfm)
content = content.replace(
  /<div className=\{`fixed inset-y-0 right-0 w-full sm:w-\[400px\] bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col \${isChatOpen \? 'translate-x-0' : 'translate-x-full'}`\}>/g,
  `<div className={\`fixed inset-y-0 right-0 w-full md:w-[450px] border-l border-white/40 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col bg-white/80 backdrop-blur-xl \${isChatOpen ? 'translate-x-0' : 'translate-x-full'}\`}>`
);
content = content.replace(
  /<div className="h-16 flex items-center justify-between px-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-white shrink-0">/g,
  `<div className="h-16 flex items-center justify-between px-4 border-b border-indigo-100/50 bg-gradient-to-r from-indigo-50/50 to-white/50 shrink-0">`
);
content = content.replace(
  /<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50\/50 scroll-smooth">/g,
  `<div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth relative z-10">`
);
content = content.replace(
  /<ReactMarkdown\n\s*components/g,
  `<ReactMarkdown\n                      remarkPlugins={[remarkGfm]}\n                      components`
);
content = content.replace(
  /<div className="p-4 bg-white border-t border-slate-100 shrink-0 pb-safe">/g,
  `<div className="p-4 bg-white/50 border-t border-indigo-100/50 shrink-0 pb-safe z-10">`
);
content = content.replace(
  /className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none text-sm font-medium transition-all placeholder:text-slate-400"/g,
  `className="w-full pl-4 pr-12 py-3 bg-white/80 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none text-sm font-medium transition-all shadow-inner placeholder:text-slate-400"`
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Update complete');

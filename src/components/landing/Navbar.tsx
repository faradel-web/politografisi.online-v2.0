"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Ефект для зміни стилю хедера при прокручуванні
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      // Врахування висоти фіксованого хедера
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const navItems = [
    { label: 'Πλατφόρμα', id: 'platform' },
    { label: 'Πώς λειτουργεί', id: 'process' },
    { label: 'Πακέτα', id: 'pricing' },
    { label: 'Επικοινωνία', id: 'contact' },
  ];

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled 
          ? "bg-white/95 backdrop-blur-md border-slate-200 shadow-sm py-3" 
          : "bg-white border-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* === LOGO === */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform font-montserrat">
              P
            </div>
            {/* Використовуємо Montserrat для логотипу */}
            <span className="font-montserrat font-black text-xl md:text-2xl text-blue-950 tracking-tight leading-none">
              POLITOGRAFISI<span className="text-blue-600">.GR</span>
            </span>
          </Link>

          {/* === DESKTOP NAV === */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item, idx) => (
               <a 
                 key={idx}
                 href={`#${item.id}`}
                 onClick={(e) => scrollToSection(e, item.id)}
                 // Використовуємо Inter (за замовчуванням), розмір 15px, вага Medium
                 className="text-[15px] font-medium text-slate-600 hover:text-blue-700 transition-colors relative group"
               >
                 {item.label}
                 {/* Анімована лінія підкреслення */}
                 <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
               </a>
            ))}
          </nav>

          {/* === AUTH BUTTONS === */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/login" 
              // Montserrat для кнопок
              className="font-montserrat font-bold text-sm text-slate-700 hover:text-blue-700 transition-colors px-4 py-2"
            >
              Σύνδεση
            </Link>
            <Link 
              href="/register" 
              className="font-montserrat font-bold text-sm bg-blue-700 text-white px-6 py-3 rounded-xl hover:bg-blue-800 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
            >
              Εγγραφή
            </Link>
          </div>

          {/* === MOBILE TOGGLE === */}
          <button className="md:hidden text-slate-700 p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </div>
      
      {/* === MOBILE MENU === */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 absolute w-full shadow-2xl h-screen animate-in slide-in-from-top-5 duration-200">
          <div className="px-6 py-8 space-y-4 flex flex-col">
             {navItems.map((item, idx) => (
                 <a 
                   key={idx} 
                   href={`#${item.id}`} 
                   onClick={(e) => scrollToSection(e, item.id)} 
                   className="block text-lg font-bold text-slate-800 hover:text-blue-700 py-3 border-b border-slate-50 font-montserrat"
                 >
                   {item.label}
                 </a>
            ))}
            <div className="pt-6 grid grid-cols-2 gap-4">
              <Link href="/login" className="font-montserrat text-center px-4 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Σύνδεση</Link>
              <Link href="/register" className="font-montserrat text-center px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-colors">Εγγραφή</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
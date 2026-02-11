import Link from "next/link";
import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";

export default function Footer() {
  return (
    // Змінили bg-[#212529] на bg-blue-950 (Глибокий синій)
    <footer className="bg-blue-950 text-white py-12 border-t border-blue-900">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
        
        {/* Social Icons */}
        <div className="flex gap-8 mb-8">
          <a href="#" aria-label="Facebook" className="text-blue-300 hover:text-white transition-colors transform hover:scale-110 duration-200">
            <Facebook className="h-6 w-6"/>
          </a>
          <a href="#" aria-label="Instagram" className="text-blue-300 hover:text-white transition-colors transform hover:scale-110 duration-200">
            <Instagram className="h-6 w-6"/>
          </a>
          <a href="#" aria-label="YouTube" className="text-blue-300 hover:text-white transition-colors transform hover:scale-110 duration-200">
            <Youtube className="h-6 w-6"/>
          </a>
          <a href="#" aria-label="Twitter" className="text-blue-300 hover:text-white transition-colors transform hover:scale-110 duration-200">
            <Twitter className="h-6 w-6"/>
          </a>
        </div>

        {/* Copyright & Links */}
        <div className="text-center space-y-3">
            <p className="text-blue-200 text-sm font-medium">
              &copy; {new Date().getFullYear()} POLITOGRAFISI.ONLINE.
            </p>
            
            <div className="flex items-center justify-center gap-4 text-xs font-bold tracking-wider text-blue-400">
                <Link href="/terms" className="hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5">
                    ΟΡΟΙ ΧΡΗΣΗΣ
                </Link>
                <span className="text-blue-800">•</span>
                <Link href="/privacy" className="hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5">
                    ΠΟΛΙΤΙΚΗ ΑΠΟΡΡΗΤΟΥ
                </Link>
            </div>
        </div>

      </div>
    </footer>
  );
}
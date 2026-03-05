"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
    UserCircle, LayoutDashboard, BookOpen, Trophy,
    ShieldCheck, PenTool, Menu, X, LogOut
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { USER_ROLES } from "@/lib/constants";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function Header() {
    const { user } = useAuth();
    const pathname = usePathname();

    // Стан для мобільного меню
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Безпечне отримання ролі
    const role = user?.role || USER_ROLES.GUEST;
    const isAdmin = role === USER_ROLES.ADMIN;
    const isEditor = role === USER_ROLES.EDITOR;

    const navLinks = [
        { name: "Αρχική", href: "/dashboard", icon: LayoutDashboard },
        { name: "Θεωρία", href: "/theory", icon: BookOpen },
        { name: "Εξάσκηση", href: "/practice", icon: PenTool },
        { name: "Προσομοίωση", href: "/exam", icon: Trophy },
    ];

    const getRoleLabel = () => {
        switch (role) {
            case USER_ROLES.ADMIN: return 'ΔΙΑΧΕΙΡΙΣΤΗΣ';
            case USER_ROLES.EDITOR: return 'ΕΠΙΜΕΛΗΤΗΣ';
            case USER_ROLES.STUDENT: return 'ΣΠΟΥΔΑΣΤΗΣ';
            default: return 'ΕΠΙΣΚΕΠΤΗΣ';
        }
    };

    return (
        <>
            <header className="sticky top-0 z-50 flex h-20 items-center justify-between bg-white dark:bg-slate-900 px-4 shadow-sm sm:px-6 lg:px-8 border-b border-slate-100 dark:border-slate-800 transition-colors duration-200">

                {/* Логотип */}
                <div className="flex items-center gap-8 shrink-0">
                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="relative h-12 w-12 flex items-center justify-center group-hover:scale-105 transition-transform bg-white rounded-full">
                            <Image
                                src="/logo-circle.jpg"
                                alt="Politografisi Logo"
                                fill
                                sizes="48px"
                                className="object-contain mix-blend-multiply border border-slate-100 dark:border-slate-800 rounded-full dark:mix-blend-normal"
                            />
                        </div>
                        <span className="font-montserrat font-black text-lg md:text-xl text-blue-950 dark:text-white tracking-tight leading-none">
                            POLITOGRAFISI<span className="text-blue-600">.ONLINE</span>
                        </span>
                    </Link>
                </div>

                {/* DESKTOP Навігація (Прихована на мобільних) */}
                <nav className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive
                                    ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                                    }`}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                                {link.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Δεξί τμήμα */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">

                    {/* Desktop Admin Actions */}
                    {isAdmin && (
                        <Link
                            href="/admin/users"
                            className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Admin
                        </Link>
                    )}

                    {isEditor && (
                        <Link
                            href="/admin"
                            className="hidden md:flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-orange-700 transition-all shadow-md"
                        >
                            <PenTool className="h-4 w-4" />
                            Editor
                        </Link>
                    )}

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Προφίλ (Завжди видимий) */}
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 sm:p-2 -mr-2 rounded-xl transition-all cursor-pointer group/profile"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover/profile:text-blue-700 dark:group-hover/profile:text-blue-400">
                                {user?.displayName || "Χρήστης"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                                {getRoleLabel()}
                            </p>
                        </div>

                        <div className="h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm group-hover/profile:border-blue-200 dark:group-hover/profile:border-blue-700">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="User" className="h-full w-full object-cover" />
                            ) : (
                                <UserCircle className="h-6 w-6 text-slate-400 dark:text-slate-500 group-hover/profile:text-blue-500 dark:group-hover/profile:text-blue-400" />
                            )}
                        </div>
                    </Link>

                    {/* MOBILE MENU TOGGLE (Видимий тільки на мобільних) */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </header>

            {/* MOBILE DRAWER (Висувне меню) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Panel */}
                    <div className="relative w-[280px] h-full bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between">
                            <span className="font-montserrat font-black text-slate-900 dark:text-white">ΜΕΝΟΥ</span>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Mobile Navigation Links */}
                        <nav className="flex flex-col gap-2">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                                            ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                                            }`}
                                    >
                                        <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                                        {link.name}
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="h-px bg-slate-100 w-full" />

                        {/* Mobile Admin/Editor Actions */}
                        <div className="flex flex-col gap-3">
                            {isAdmin && (
                                <Link
                                    href="/admin/users"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold uppercase tracking-wider"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    Admin Panel
                                </Link>
                            )}
                            {isEditor && (
                                <Link
                                    href="/admin"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider"
                                >
                                    <PenTool className="h-4 w-4" />
                                    Editor Mode
                                </Link>
                            )}
                        </div>

                        <div className="mt-auto">
                            <p className="text-xs text-center text-slate-400 font-medium">
                                © 2026 Politografisi.online | All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
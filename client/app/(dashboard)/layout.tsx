"use client";

import { apiFetch } from "@/lib/apiFetch";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const brandNav = [
    { label: "Dashboard", href: "/brand" },
    { label: "My Requests", href: "/brand/requests" },
];

const customerNav = [
    { label: "Dashboard", href: "/customer" },
    { label: "Submission of Proof", href: "/customer/submissions" },
    { label: "Payment Info", href: "/customer/payment-info" },
    { label: "FAQ", href: "/customer/faq" },
    { label: "Support", href: "/customer/support" },
];

const adminNav = [
    { label: "Dashboard", href: "/admin" },
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Products", href: "/admin/products" },
    { label: "Brands", href: "/admin/brands" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Refund Requests", href: "/admin/refunds" },
    { label: "Support Inbox", href: "/admin/support" },
];

function getNav(pathname: string) {
    if (pathname.startsWith("/admin")) return { nav: adminNav, title: "Admin Panel" };
    if (pathname.startsWith("/brand")) return { nav: brandNav, title: "Brand Panel" };
    if (pathname.startsWith("/customer")) return { nav: customerNav, title: "Customer panel" };
    return { nav: [], title: "Dashboard" };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { nav, title } = getNav(pathname);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [userProfile, setUserProfile] = useState({ name: "", role: "" });

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedRole = localStorage.getItem("role"); // Assuming we save role on login
        const role = storedRole ? storedRole.toUpperCase() : null;

        if (!token || !role) {
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }

        // Basic frontend role checking
        if (pathname.startsWith("/admin") && role !== "ADMIN") {
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }
        if (pathname.startsWith("/brand") && role !== "VENDOR") {
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }
        if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }

        setIsAuthorized(true);
        setUserProfile({
            name: role === "ADMIN" ? "Admin User" : (localStorage.getItem("name") || "User"),
            role: role || "CUSTOMER"
        });
    }, [pathname, router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name");
        router.push("/login");
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 rounded-full border-4 border-t-[#d4af37] border-r-[#d4af37] border-b-[#d4af37]/20 border-l-[#d4af37]/20 animate-spin"></div>
                    <p className="text-[#d4af37]/70 text-xs uppercase tracking-[0.2em] font-sans">Authenticating Session</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-[#d4af37]/20">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card/60 backdrop-blur-xl border-r border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hidden md:flex flex-col">
                {/* Logo Area */}
                <div className="flex items-center justify-center h-24 border-b border-white/5 shrink-0">
                    <Link href={nav[0].href} className="flex flex-col items-center justify-center w-full group transition-transform hover:scale-105">
                        <h2 className="font-heading text-3xl font-bold tracking-widest text-[#d4af37] uppercase">
                            BRMS
                        </h2>
                        <div className="h-[1px] w-12 bg-[#d4af37]/50 mt-1 mb-1" />
                        <p className="font-sans text-[9px] tracking-[0.2em] text-[#d4af37]/70 uppercase">Brand For You</p>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto hide-scrollbar">
                    <div className="px-3 mb-4 text-[10px] font-sans text-white/30 uppercase tracking-[0.2em]">
                        {title}
                    </div>
                    {nav.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-sans rounded-sm transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? "text-[#d4af37] bg-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeNav"
                                        className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#d4af37] shadow-[0_0_10px_#d4af37]"
                                    />
                                )}
                                <span className={isActive ? "translate-x-2 transition-transform" : "transition-transform group-hover:translate-x-2"}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
                {/* Profile & Logout Section */}
                <div className="p-4 border-t border-white/5 bg-black/20 shrink-0">
                    <div className="flex items-center mb-5 px-2">
                        <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-[#d4af37] to-[#8a7322] rounded-full flex items-center justify-center text-black font-bold text-sm shadow-[0_0_15px_rgba(212,175,55,0.3)] ring-1 ring-white/20">
                            {userProfile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 truncate">
                            <p className="text-sm font-sans text-white truncate leading-tight">
                                {userProfile.name}
                            </p>
                            <p className="text-[10px] font-sans text-[#d4af37]/80 uppercase tracking-[0.1em] mt-1">
                                {userProfile.role}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex justify-center items-center px-4 py-2.5 text-xs font-sans uppercase tracking-widest text-white/70 hover:text-white bg-transparent border border-white/10 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10 transition-all focus:outline-none focus:ring-1 focus:ring-[#d4af37] active:scale-[0.98]"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:pl-64 relative min-h-screen">
                {/* Background ambient glow */}
                <div className="fixed top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#d4af37]/5 to-transparent pointer-events-none opacity-50 z-0"></div>

                <div className="py-10 px-4 sm:px-8 md:px-12 mx-auto max-w-[1600px] relative z-10 w-full min-h-screen">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="w-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

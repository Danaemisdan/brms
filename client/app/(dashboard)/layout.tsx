"use client";

import { apiFetch } from "@/lib/apiFetch";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

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
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedRole = localStorage.getItem("role"); 
        const role = storedRole ? storedRole.toUpperCase() : null;

        if (!token || !role) {
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }

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
                    <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-primary border-b-primary/20 border-l-primary/20 animate-spin"></div>
                    <p className="text-primary/70 text-xs uppercase tracking-[0.2em] font-sans font-semibold">Authenticating Session</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card/80 backdrop-blur-xl border-r border-border shadow-sm hidden md:flex flex-col">
                {/* Logo Area */}
                <div className="flex items-center justify-center h-24 border-b border-border shrink-0">
                    <Link href={nav[0]?.href || "/"} className="flex flex-col items-center justify-center w-full group transition-transform hover:scale-105">
                        <h2 className="font-sans text-3xl font-bold tracking-widest text-primary uppercase">
                            BRMS
                        </h2>
                        <div className="h-[2px] w-12 bg-primary/50 mt-1 mb-1" />
                        <p className="font-sans text-[9px] tracking-[0.2em] text-primary/70 font-semibold uppercase">Brand For You</p>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto hide-scrollbar">
                    <div className="px-3 mb-4 text-[10px] font-sans font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        {title}
                    </div>
                    {nav.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-sans font-medium rounded-sm transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeNav"
                                        className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary shadow-[0_0_10px_var(--color-primary)]"
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
                <div className="p-4 border-t border-border bg-card shrink-0">
                    <div className="flex items-center mb-5 px-2">
                        <div className="h-10 w-10 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm ring-1 ring-primary/20">
                            {userProfile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 truncate flex-1">
                            <p className="text-sm font-sans font-semibold text-foreground truncate leading-tight">
                                {userProfile.name}
                            </p>
                            <p className="text-[10px] font-sans font-bold text-primary/80 uppercase tracking-[0.1em] mt-1">
                                {userProfile.role}
                            </p>
                        </div>
                        {mounted && (
                            <button 
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
                                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                aria-label="Toggle Theme"
                            >
                                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex justify-center items-center px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground bg-transparent border border-border hover:border-primary/50 hover:bg-primary/10 transition-all focus:outline-none focus:ring-1 focus:ring-primary active:scale-[0.98]"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:pl-64 relative min-h-screen">
                {/* Background ambient glow */}
                <div className="fixed top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none opacity-50 z-0"></div>

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

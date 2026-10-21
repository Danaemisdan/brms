"use client";

import { apiFetch } from "@/lib/apiFetch";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { 
    Moon, 
    Sun, 
    LayoutDashboard, 
    BarChart3, 
    Package, 
    CheckSquare, 
    Briefcase, 
    MessageSquare, 
    Layers, 
    FileText, 
    Sparkles, 
    Video, 
    CreditCard, 
    Users, 
    ShoppingBag, 
    Wallet, 
    Inbox, 
    ShieldCheck,
    Tag,
    HelpCircle,
    FileCheck,
    LifeBuoy,
    Menu,
    X
} from "lucide-react";

const brandNav = [
    { label: "Dashboard", href: "/brand", icon: LayoutDashboard },
    { label: "My Requests", href: "/brand/requests", icon: FileText },
];

const customerNav = [
    { label: "Deals", href: "/customer", icon: Tag },
    { label: "Creator Dashboard", href: "/creator", icon: Sparkles },
    { label: "Track Order Status", href: "/customer/submissions", icon: FileCheck },
    { label: "Tasks & Offers", href: "/customer/tasks", icon: CheckSquare },
    { label: "Payment Info", href: "/customer/payment-info", icon: CreditCard },
    { label: "FAQ", href: "/customer/faq", icon: HelpCircle },
    { label: "Support", href: "/customer/support", icon: LifeBuoy },
];

const creatorNav = [
    { label: "Dashboard & Activities", href: "/creator", icon: Sparkles },
    { label: "My Wallet", href: "/customer/payment-info", icon: Wallet },
];

const adminNav = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Refund Requests", href: "/admin/refunds", icon: Wallet },
    { label: "Tasks", href: "/admin/tasks", icon: CheckSquare },
    { label: "Brands", href: "/admin/brands", icon: Briefcase },
    { label: "Tickets", href: "/admin/tickets", icon: MessageSquare },
    { label: "Services", href: "/admin/services", icon: Layers },
    { label: "Custom Forms", href: "/admin/custom-forms", icon: FileText },
    { label: "Creators", href: "/admin/creators", icon: Sparkles },
    { label: "Creator Activities", href: "/admin/activities", icon: Video },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Support Inbox", href: "/admin/support", icon: Inbox },
    { label: "Security & 2FA", href: "/admin/security", icon: ShieldCheck },
];

function getNav(pathname: string) {
    if (pathname.startsWith("/admin")) return { nav: adminNav, title: "Admin Console" };
    if (pathname.startsWith("/brand")) return { nav: brandNav, title: "Brand Console" };
    if (pathname.startsWith("/creator")) return { nav: customerNav, title: "Customer Console" };
    if (pathname.startsWith("/customer")) return { nav: customerNav, title: "Customer Console" };
    return { nav: [], title: "Console" };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { nav, title } = getNav(pathname);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [userProfile, setUserProfile] = useState({ name: "", role: "" });
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchServices();
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const fetchServices = async () => {
        try {
            const res = await apiFetch("/api/services");
            if (res.ok) {
                const data = await res.json();
                setServices(data.services || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

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
        if (pathname.startsWith("/customer") && role !== "CUSTOMER" && role !== "CREATOR") {
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }
        if (pathname.startsWith("/creator") && role !== "CREATOR" && role !== "CUSTOMER") {
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
                    <div className="h-8 w-8 rounded-full border-2 border-t-foreground border-r-foreground border-b-transparent border-l-transparent animate-spin"></div>
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-sans font-semibold">Authenticating Session</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-foreground/10 antialiased">
            {/* Desktop 21st.dev Luxurious Glass Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card/70 dark:bg-zinc-950/70 backdrop-blur-2xl border-r border-border/80 shadow-[1px_0_15px_rgba(0,0,0,0.02)] hidden md:flex flex-col">
                {/* Logo Area */}
                <div className="flex items-center justify-between h-20 px-6 border-b border-border/60 shrink-0">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <span className="text-lg font-black tracking-tighter text-foreground">sample lelo</span>
                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full border border-zinc-200/80 dark:border-zinc-700/80">
                            {userProfile.role === "ADMIN" ? "Admin" : "Console"}
                        </span>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto hide-scrollbar">
                    <div className="px-3 mb-3 text-[10px] font-sans font-bold text-muted-foreground uppercase tracking-[0.18em]">
                        {title}
                    </div>
                    {nav.map((item) => {
                        const IconComponent = item.icon || Layers;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 group relative ${
                                    isActive
                                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
                                }`}
                            >
                                <IconComponent className={`w-4 h-4 shrink-0 transition-colors ${
                                    isActive 
                                        ? "text-white dark:text-zinc-950" 
                                        : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-950 dark:group-hover:text-zinc-100"
                                }`} />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                    
                    {/* Dynamic Services Section */}
                    {services.length > 0 && (
                        <div className="pt-4 space-y-1">
                            <div className="px-3 mb-2 text-[10px] font-sans font-bold text-muted-foreground uppercase tracking-[0.18em]">
                                Custom Services
                            </div>
                            {services.map((service) => {
                                const href = userProfile.role === "ADMIN" 
                                    ? `/admin/services/${service.id}` 
                                    : userProfile.role === "CUSTOMER" 
                                        ? `/customer/services/${service.id}` 
                                        : `/services/${service.id}`;
                                const isActive = pathname.includes(service.id);
                                return (
                                    <Link
                                        key={service.id}
                                        href={href}
                                        className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 group ${
                                            isActive
                                                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
                                        }`}
                                    >
                                        <Layers className="w-4 h-4 shrink-0 opacity-70" />
                                        <span className="truncate">{service.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </nav>
                
                {/* Profile & Logout Section */}
                <div className="p-3 border-t border-border/60 bg-card/50 shrink-0 space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-100/60 dark:bg-zinc-900/60 border border-border/40">
                        <div className="flex items-center gap-2.5 truncate">
                            <div className="h-8 w-8 flex-shrink-0 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg flex items-center justify-center font-bold text-xs">
                                {userProfile.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                                    {userProfile.name}
                                </p>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                                    {userProfile.role}
                                </p>
                            </div>
                        </div>
                        {mounted && (
                            <button 
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
                                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                                aria-label="Toggle Theme"
                            >
                                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex justify-center items-center px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg border border-transparent hover:border-border transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header Bar */}
            <header className="md:hidden fixed top-0 inset-x-0 z-40 h-16 bg-card/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-border/80 px-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 -ml-2 text-foreground/80 hover:text-foreground rounded-xl hover:bg-muted transition-colors"
                        aria-label="Open Navigation Menu"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-base font-black tracking-tight text-foreground">sample lelo</span>
                        <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold tracking-widest uppercase bg-muted text-muted-foreground rounded-full border border-border">
                            {userProfile.role === "ADMIN" ? "Admin" : "Console"}
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    {mounted && (
                        <button 
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
                            className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
                            aria-label="Toggle Theme"
                        >
                            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    )}
                    <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
                        {userProfile.name.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* Mobile Drawer Backdrop & Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 250 }}
                            className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-card dark:bg-zinc-950 border-r border-border shadow-2xl flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between h-16 px-5 border-b border-border/80">
                                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                                    <span className="text-base font-black tracking-tight text-foreground">sample lelo</span>
                                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-muted text-muted-foreground rounded-full border border-border">
                                        {userProfile.role === "ADMIN" ? "Admin" : "Console"}
                                    </span>
                                </Link>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Drawer Nav Items */}
                            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                                <div className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {title}
                                </div>
                                {nav.map((item) => {
                                    const IconComponent = item.icon || Layers;
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all ${
                                                isActive
                                                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                                                    : "text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <IconComponent className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{item.label}</span>
                                        </Link>
                                    );
                                })}

                                {services.length > 0 && (
                                    <div className="pt-4 space-y-1">
                                        <div className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Custom Services
                                        </div>
                                        {services.map((service) => {
                                            const href = userProfile.role === "ADMIN" 
                                                ? `/admin/services/${service.id}` 
                                                : userProfile.role === "CUSTOMER" 
                                                    ? `/customer/services/${service.id}` 
                                                    : `/services/${service.id}`;
                                            const isActive = pathname.includes(service.id);
                                            return (
                                                <Link
                                                    key={service.id}
                                                    href={href}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all ${
                                                        isActive
                                                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs"
                                                            : "text-zinc-600 dark:text-zinc-400 hover:text-foreground hover:bg-muted"
                                                    }`}
                                                >
                                                    <Layers className="w-4 h-4 shrink-0" />
                                                    <span className="truncate">{service.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </nav>

                            {/* Drawer Footer */}
                            <div className="p-3 border-t border-border/80 bg-card/50 space-y-2">
                                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/50 border border-border">
                                    <div className="flex items-center gap-2.5 truncate">
                                        <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs shrink-0">
                                            {userProfile.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="truncate">
                                            <p className="text-xs font-semibold text-foreground truncate">{userProfile.name}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground uppercase">{userProfile.role}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex justify-center items-center px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-xl border border-transparent transition-all"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area with 21st.dev Ambient Lighting */}
            <main className="flex-1 md:pl-64 relative min-h-screen pt-16 md:pt-0">
                {/* Subtle luxury ambient mesh glow */}
                <div className="fixed top-0 inset-x-0 h-[400px] bg-gradient-to-b from-zinc-200/40 dark:from-zinc-900/30 via-transparent to-transparent pointer-events-none opacity-40 z-0"></div>

                <div className="py-6 sm:py-8 px-3 sm:px-6 md:px-10 mx-auto max-w-[1600px] relative z-10 w-full min-h-[calc(100vh-4rem)] md:min-h-screen">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
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

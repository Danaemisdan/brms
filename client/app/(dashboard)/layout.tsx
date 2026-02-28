"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const brandNav = [
    { label: "Dashboard", href: "/brand" },
    { label: "My Requests", href: "/brand/requests" },
];

const customerNav = [
    { label: "Dashboard", href: "/customer" },
    { label: "Submission of Proof", href: "/customer/submissions" },
    { label: "Support", href: "/customer/support" },
    { label: "Payment Info", href: "/customer/payment-info" }
];

const adminNav = [
    { label: "Dashboard", href: "/admin" },
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
        const role = localStorage.getItem("role"); // Assuming we save role on login

        if (!token) {
            router.push("/login");
            return;
        }

        // Basic frontend role checking
        if (pathname.startsWith("/admin") && role !== "ADMIN") {
            router.push("/login");
            return;
        }
        if (pathname.startsWith("/brand") && role !== "VENDOR") {
            router.push("/login");
            return;
        }
        if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
            router.push("/login");
            return;
        }

        setIsAuthorized(true);
        setUserProfile({
            name: role === "ADMIN" ? "Shruti Jaigariya" : (localStorage.getItem("name") || "User"),
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 rounded-full border-4 border-t-blue-600 border-r-blue-600 border-b-blue-600/20 border-l-blue-600/20 animate-spin"></div>
                    <p className="text-gray-500 text-sm font-medium tracking-wide">Authenticating secure session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm hidden md:flex flex-col">
                {/* Logo Area */}
                <div className="flex items-center justify-start h-20 px-6 border-b border-gray-100 shrink-0">
                    <Link href={nav[0].href} className="flex items-center justify-start w-full group transition-transform hover:scale-105">
                        <img src="/logo.svg" alt="BRMS Logo" className="h-16 w-auto" />
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto hide-scrollbar">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {title}
                    </div>
                    {nav.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive
                                    ? "text-blue-700 bg-blue-50 ring-1 ring-inset ring-blue-100"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full shadow-sm"></div>
                                )}
                                <span className={isActive ? "translate-x-1 transition-transform" : "transition-transform group-hover:translate-x-1"}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
                {/* Profile & Logout Section */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
                    <div className="flex items-center mb-4 px-2">
                        <div className="h-9 w-9 flex-shrink-0 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                            {userProfile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 truncate">
                            <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                                {userProfile.name}
                            </p>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-0.5">
                                {userProfile.role}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-[0.98]"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:pl-64 relative">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white to-transparent pointer-events-none opacity-50 z-0"></div>

                <div className="py-8 px-4 sm:px-6 md:px-10 mx-auto max-w-[1600px] relative z-10 w-full min-h-screen">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

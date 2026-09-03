"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isDateMatch, DateFilterType } from "@/lib/dateUtils";

const API_URL = "";

export default function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState<DateFilterType>("ALL");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Failed to fetch orders:");
        } finally {
            setIsLoading(false);
        }
    };

    const statusColor: Record<string, string> = {
        SUBMITTED: "bg-blue-100 text-blue-800",
        VALIDATING: "bg-yellow-100 text-yellow-800",
        VALIDATED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
    };

    return (
        <div className="space-y-10 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-border/5 pb-6">
                <div>
                    <h1 className="text-4xl font-sans font-bold text-primary tracking-wider uppercase">Order Intelligence</h1>
                    <p className="text-foreground/40 mt-2 font-sans tracking-wide text-sm">
                        Real-time feed of all incoming campaign operations.
                    </p>
                    <p className="text-foreground/30 text-xs mt-2 font-mono flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        Syncing live with Google Sheets infrastructure
                    </p>
                </div>
                <Button variant="outline" className="bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 font-sans tracking-widest uppercase text-xs h-12 px-6 rounded-sm transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)]" onClick={() => window.open(`${API_URL}/api/orders/export?token=brms_export_secret_123`, "_blank")}>
                    Export Dossier
                </Button>
            </div>

            <Card className="p-6 mb-8 glass-panel border-border/5">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Input
                            placeholder="Trace order ID, mobile, or product designation..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 bg-foreground/40 border-border/10 text-foreground placeholder:text-foreground/30 focus:border-primary/50 font-sans tracking-wide"
                        />
                    </div>
                    <select
                        className="h-12 w-full md:w-[200px] rounded-sm border border-border/10 bg-foreground/40 px-3 text-foreground text-sm font-sans outline-none focus:border-primary/50 tracking-wide uppercase"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="VALIDATING">Validating</option>
                        <option value="VALIDATED">Validated</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <select
                        className="h-12 w-full md:w-[200px] rounded-sm border border-border/10 bg-foreground/40 px-3 text-foreground text-sm font-sans outline-none focus:border-primary/50 tracking-wide uppercase"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                    >
                        <option value="ALL">All Time</option>
                        <option value="TODAY">Today</option>
                        <option value="YESTERDAY">Yesterday</option>
                        <option value="LAST_7_DAYS">Last 7 Days</option>
                        <option value="LAST_30_DAYS">Last 30 Days</option>
                    </select>
                </div>
            </Card>

            <div className="space-y-6">
                {isLoading ? (
                    <p className="text-center text-primary/70 py-12 font-sans tracking-widest text-xs uppercase animate-pulse">Decrypting orders...</p>
                ) : (() => {
                    const filteredOrders = orders.filter(order => {
                        const matchesSearch =
                            (order.order_id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                            (order.user?.mobile || "").includes(searchTerm) ||
                            (order.product?.product_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());

                        const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
                        const matchesDate = isDateMatch(order.created_at, dateFilter);

                        return matchesSearch && matchesStatus && matchesDate;
                    });

                    if (filteredOrders.length === 0) {
                        return (
                            <Card className="p-12 text-center glass-panel border-border/5">
                                <p className="text-foreground/40 font-sans tracking-wide">No operations found matching current parameters.</p>
                            </Card>
                        );
                    }

                    return filteredOrders.map((order) => (
                        <Card key={order.id} className="p-6 glass-panel border-primary/10 hover:border-primary/30 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-[0_0_20px_rgba(212,175,55,0.02)]">
                            <div>
                                <CardTitle className="text-xl font-sans font-bold text-primary tracking-wide mb-2">
                                    {order.product?.product_name || "Unknown Product"}
                                </CardTitle>
                                <CardDescription className="text-foreground/50 font-sans text-xs tracking-widest uppercase">
                                    <span className="text-foreground">{order.user?.name || order.user?.mobile}</span> • {order.product?.platform} • <span className="font-mono text-primary/70">{order.order_id}</span> • {new Date(order.created_at).toLocaleDateString()}
                                </CardDescription>
                                {order.screenshot_url && order.screenshot_url !== "https://dummyimage.com/600x400/000/fff&text=Order+Screenshot" && (
                                    <a href={order.screenshot_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary/80 hover:text-primary tracking-widest uppercase font-sans mt-3 inline-block border-b border-primary/30 hover:border-primary">Access Intelligence Image</a>
                                )}
                            </div>
                            <span className={`px-4 py-2 text-[10px] font-sans tracking-widest uppercase rounded-sm border ${
                                order.status === 'SUBMITTED' ? 'bg-blue-900/20 text-blue-400 border-blue-500/30' :
                                order.status === 'VALIDATING' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-500/30' :
                                order.status === 'VALIDATED' ? 'bg-green-900/20 text-green-400 border-green-500/30' :
                                order.status === 'REJECTED' ? 'bg-red-900/20 text-red-400 border-red-500/30' :
                                'bg-white/5 text-foreground/50 border-border/10'
                            }`}>
                                {order.status}
                            </span>
                        </Card>
                    ));
                })()}
            </div>
        </div>
    );
}

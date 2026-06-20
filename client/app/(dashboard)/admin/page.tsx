"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        activeProducts: 0,
        pendingRefunds: 0,
        totalCustomers: 0, // Using unique orders as a proxy for now
        totalRefunded: 0,
        pendingProducts: 0,
        reviewQueuePending: 0,
        reviewQueueInProgress: 0,
        whatsappQueuePending: 0,
        whatsappQueueInProgress: 0
    });

    // Using pending products for the pending vendors list for now
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [pendingRefundOrders, setPendingRefundOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [ordersRes, productsRes, agentStatsRes] = await Promise.all([
                apiFetch(`${API_URL}/api/orders`, { headers }),
                apiFetch(`${API_URL}/api/products`, { headers }),
                apiFetch(`${API_URL}/api/refunds/tasks/stats`, { headers })
            ]);

            if (ordersRes.ok && productsRes.ok) {
                const ordersData = await ordersRes.json();
                const productsData = await productsRes.json();
                const agentStatsData = agentStatsRes.ok ? await agentStatsRes.json() : { stats: {} };

                const orders = ordersData.orders || [];
                const products = productsData.products || [];
                const queueStats = agentStatsData.stats || {};
                const reviewQueue = queueStats.REVIEW_VERIFY || {};
                const whatsappQueue = queueStats.WHATSAPP_BLAST || {};

                const pendingRefundsCount = orders.filter((o: any) => o.refund?.status === "PENDING").length;
                const totalRefundAmount = orders.filter((o: any) => o.refund?.status === "REFUNDED").reduce((sum: number, o: any) => sum + o.refund.amount, 0);
                const uniqueCustomers = new Set(orders.map((o: any) => o.user_id)).size;
                const activeProducts = products.filter((p: any) => p.status === "ACTIVE").length;
                const draftProducts = products.filter((p: any) => p.status === "REQUESTED" || p.status === "DRAFT");

                setStats({
                    activeProducts,
                    pendingRefunds: pendingRefundsCount,
                    totalCustomers: uniqueCustomers,
                    totalRefunded: totalRefundAmount,
                    pendingProducts: draftProducts.length,
                    reviewQueuePending: reviewQueue.PENDING || 0,
                    reviewQueueInProgress: reviewQueue.IN_PROGRESS || 0,
                    whatsappQueuePending: whatsappQueue.PENDING || 0,
                    whatsappQueueInProgress: whatsappQueue.IN_PROGRESS || 0
                });

                setPendingRequests(draftProducts);

                // Filter for "Today"
                const today = new Date().toISOString().split('T')[0];
                const isToday = (dateString: string) => dateString && dateString.split('T')[0] === today;

                const recent = orders
                    .filter((o: any) => o.status === "SUBMITTED" && (isToday(o.created_at) || isToday(o.order_date)))
                    .slice(0, 5);

                const refunds = orders
                    .filter((o: any) => o.refund?.status === "PENDING" && (isToday(o.created_at) || isToday(o.order_date) || isToday(o.refund?.created_at)))
                    .slice(0, 5);

                setRecentOrders(recent);
                setPendingRefundOrders(refunds);
            }
        } catch (error) {
            console.error("Failed to fetch admin dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, action: string) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            setIsLoading(true);

            if (action === "approve") {
                const res = await apiFetch(`${API_URL}/api/products/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: "ACTIVE" })
                });

                if (res.ok) {
                    toast.success(`Product #${id} approved and listed actively.`);
                    fetchDashboardData();
                } else {
                    toast.error("Failed to approve product.");
                    setIsLoading(false);
                }
            } else if (action === "decline") {
                const res = await apiFetch(`${API_URL}/api/products/${id}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    toast.success(`Product #${id} deleted.`);
                    fetchDashboardData();
                } else {
                    toast.error("Failed to delete product.");
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.error("Action failed:", error);
            toast.error("An error occurred during the product action request.");
            setIsLoading(false);
        }
    };

    const metrics = [
        { label: "Active Products", value: stats.activeProducts },
        { label: "Pending Products", value: stats.pendingProducts },
        { label: "Total Customers", value: stats.totalCustomers },
        { label: "Pending Refunds", value: stats.pendingRefunds },
        { label: "Review Queue", value: `${stats.reviewQueuePending}P / ${stats.reviewQueueInProgress}IP` },
        { label: "WhatsApp Queue", value: `${stats.whatsappQueuePending}P / ${stats.whatsappQueueInProgress}IP` },
        { label: "Total Vendors", value: "1 (Admin)" },
        { label: "Total Refunded", value: `₹${stats.totalRefunded}` },
    ];

    return (
        <div className="space-y-10 relative z-10">
            <div className="border-b border-border/5 pb-6">
                <h1 className="text-4xl font-sans font-bold text-primary tracking-wider uppercase">Admin Portal</h1>
                <p className="text-foreground/40 mt-2 font-sans tracking-wide text-sm">Full command over campaigns, vendors, customers, and financials.</p>
            </div>

            {isLoading ? (
                <p className="text-primary/70 py-8 font-sans tracking-widest text-xs uppercase animate-pulse">Loading intelligence...</p>
            ) : (
                <>
                    {/* Metrics */}
                    <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                        {metrics.map((m, i) => (
                            <Card key={i} className="glass-panel hover:bg-white/5 transition-colors border-border/5 shadow-none">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-sans tracking-widest text-foreground/50 uppercase">{m.label}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-sans font-bold text-primary">{m.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pending Vendor Requests */}
                    <div className="space-y-6 pt-6">
                        <h2 className="text-xl font-sans font-bold text-foreground tracking-widest uppercase border-b border-border/5 pb-4">Pending Authorization</h2>
                        {pendingRequests.length === 0 ? (
                            <p className="text-sm font-sans tracking-wide text-foreground/40">No pending products require authorization.</p>
                        ) : (
                            pendingRequests.map((req) => (
                                <Card key={req.id} className="p-6 glass-panel border-primary/20 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                                    <div>
                                        <h3 className="font-sans font-bold text-xl text-primary tracking-wide">{req.product_name}</h3>
                                        <p className="text-xs font-sans tracking-widest text-foreground/50 uppercase mt-2">
                                            By <span className="text-foreground font-medium">{req.brand}</span> • {req.platform} • {req.total_slots} Slots • ₹{req.refund_amount}/Review
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 font-sans tracking-widest uppercase text-[10px] h-10 px-6 rounded-sm" onClick={() => handleAction(req.id, "decline")}>
                                            Reject
                                        </Button>
                                        <Button className="bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 font-sans tracking-widest uppercase text-[10px] h-10 px-6 rounded-sm transition-all" onClick={() => handleAction(req.id, "approve")}>
                                            Authorize
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Action Required: Pending Refunds */}
                    <div className="space-y-6 pt-8">
                        <h2 className="text-xl font-sans font-bold text-foreground tracking-widest uppercase border-b border-border/5 pb-4">
                            Refunds Escrow ({stats.pendingRefunds})
                        </h2>
                        {pendingRefundOrders.length === 0 ? (
                            <p className="text-sm font-sans tracking-wide text-foreground/40">No escrow operations pending.</p>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {pendingRefundOrders.map((req) => (
                                    <Card key={req.id} className="p-5 glass-panel border-yellow-500/30 bg-yellow-900/5 hover:bg-yellow-900/10 transition-colors">
                                        <CardHeader className="p-0 pb-4">
                                            <CardTitle className="text-lg font-sans font-bold text-yellow-500">Escrow: ₹{req.product?.refund_amount}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0 space-y-3">
                                            <p className="text-xs font-sans tracking-widest text-foreground/50 uppercase">Product: <span className="text-foreground ml-1">{req.product?.product_name}</span></p>
                                            <p className="text-xs font-sans tracking-widest text-foreground/50 uppercase">Order ID: <span className="text-foreground ml-1">{req.order_id}</span></p>
                                            <p className="text-xs font-sans tracking-widest text-foreground/50 uppercase">Customer: <span className="text-foreground ml-1">{req.user?.mobile}</span></p>
                                            <Button className="w-full mt-4 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/20 font-sans tracking-widest uppercase text-[10px] h-10 rounded-sm" onClick={() => window.location.href = '/admin/refunds'}>
                                                Process Escrow
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Order Submissions */}
                    <div className="space-y-6 pt-8 pb-12">
                        <h2 className="text-xl font-sans font-bold text-foreground tracking-widest uppercase border-b border-border/5 pb-4">Recent Campaign Activity</h2>
                        {recentOrders.length === 0 ? (
                            <p className="text-sm font-sans tracking-wide text-foreground/40">No recent activity detected.</p>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {recentOrders.map((req) => (
                                    <Card key={req.id} className="p-5 glass-panel border-primary/20 hover:border-primary/40 transition-all">
                                        <CardHeader className="p-0 pb-4">
                                            <CardTitle className="text-sm font-sans tracking-widest text-foreground/70 uppercase">Order: <span className="text-primary">{req.order_id}</span></CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0 space-y-3">
                                            <p className="text-xs font-sans tracking-widest text-foreground/50 uppercase">Product: <span className="text-foreground ml-1">{req.product?.product_name}</span></p>
                                            <p className="text-xs font-sans tracking-widest text-foreground/50 uppercase">Customer: <span className="text-foreground ml-1">{req.user?.mobile}</span></p>
                                            <p className="text-xs font-sans tracking-widest text-foreground/50 uppercase">Amount: <span className="text-primary ml-1">₹{req.amount}</span></p>
                                            <Button className="w-full mt-4 bg-white/5 text-foreground/70 border border-border/10 hover:bg-white/10 hover:text-foreground font-sans tracking-widest uppercase text-[10px] h-10 rounded-sm" onClick={() => window.location.href = '/admin/orders'}>
                                                View Dossier
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

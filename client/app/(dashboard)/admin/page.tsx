"use client";

import { apiFetch } from "@/lib/apiFetch";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from "recharts";
import { 
    Users, 
    ShoppingBag, 
    CheckCircle2, 
    Clock, 
    TrendingUp, 
    Layers, 
    ArrowUpRight, 
    RefreshCw, 
    AlertCircle, 
    Wallet, 
    MessageSquare, 
    CheckSquare,
    ExternalLink,
    ChevronRight,
    ShoppingBasket
} from "lucide-react";

const API_URL = "";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        activeProducts: 0,
        ordersValidating: 0,
        pendingRefunds: 0,
        totalCustomers: 0,
        totalRefunded: 0,
        pendingProducts: 0,
        reviewQueuePending: 0,
        reviewQueueInProgress: 0,
        whatsappQueuePending: 0,
        whatsappQueueInProgress: 0
    });

    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [pendingRefundOrders, setPendingRefundOrders] = useState<any[]>([]);
    const [analyticsData, setAnalyticsData] = useState<{ signupTrend: any[], topProducts: any[] }>({ 
        signupTrend: [], 
        topProducts: [] 
    });
    const [selectedMetric, setSelectedMetric] = useState<"orders" | "signups">("orders");
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [ordersRes, productsRes, agentStatsRes, analyticsRes] = await Promise.all([
                apiFetch(`${API_URL}/api/orders`, { headers }),
                apiFetch(`${API_URL}/api/products`, { headers }),
                apiFetch(`${API_URL}/api/refunds/tasks/stats`, { headers }),
                apiFetch(`${API_URL}/api/analytics/dashboard`, { headers })
            ]);

            if (ordersRes.ok && productsRes.ok) {
                const ordersData = await ordersRes.json();
                const productsData = await productsRes.json();
                const agentStatsData = agentStatsRes.ok ? await agentStatsRes.json() : { stats: {} };
                const analyticsResponse = analyticsRes.ok ? await analyticsRes.json() : { signupTrend: [], topProducts: [] };

                const orders = ordersData.orders || [];
                const products = productsData.products || [];
                const queueStats = agentStatsData.stats || {};
                const reviewQueue = queueStats.REVIEW_VERIFY || {};
                const whatsappQueue = queueStats.WHATSAPP_BLAST || {};

                const pendingRefundsCount = orders.filter((o: any) => o.refund?.status === "PENDING" || o.status?.includes("Refund Processing")).length;
                const totalRefundAmount = orders.filter((o: any) => o.refund?.status === "REFUNDED").reduce((sum: number, o: any) => sum + (o.refund?.amount || 0), 0);
                const uniqueCustomers = new Set(orders.map((o: any) => o.user_id)).size;
                const activeProducts = products.filter((p: any) => p.status?.toUpperCase() === "ACTIVE").length;
                const draftProducts = products.filter((p: any) => p.status?.toUpperCase() === "REQUESTED" || p.status?.toUpperCase() === "DRAFT");

                const validatingOrdersCount = orders.filter((o: any) => o.status === "Order Validating" || o.status === "SUBMITTED").length;

                setStats({
                    activeProducts,
                    ordersValidating: validatingOrdersCount,
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

                const today = new Date().toISOString().split('T')[0];
                const isToday = (dateString: string) => dateString && dateString.split('T')[0] === today;

                const recent = orders
                    .filter((o: any) => isToday(o.created_at) || isToday(o.order_date))
                    .slice(0, 6);

                const refunds = orders
                    .filter((o: any) => (o.refund?.status === "PENDING" || o.status?.includes("Refund Processing")))
                    .slice(0, 6);

                setRecentOrders(recent.length > 0 ? recent : orders.slice(0, 6));
                setPendingRefundOrders(refunds);
                setAnalyticsData({
                    signupTrend: analyticsResponse.signupTrend || [],
                    topProducts: analyticsResponse.topProducts || []
                });
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
                    toast.success("Product approved and published to campaign catalog.");
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
                    toast.success("Product listing rejected and removed.");
                    fetchDashboardData();
                } else {
                    toast.error("Failed to delete product.");
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.error("Action failed:", error);
            toast.error("An error occurred during product review.");
            setIsLoading(false);
        }
    };

    const handleForceSync = async () => {
        setIsSyncing(true);
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/admin/sync-sheets`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.ok) {
                toast.success("Successfully synchronized with Google Sheets!");
                await fetchDashboardData();
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.message || "Failed to sync with Google Sheets.");
            }
        } catch (error) {
            console.error("Sync failed:", error);
            toast.error("Network error while syncing Google Sheets.");
        } finally {
            setIsSyncing(false);
        }
    };

    const metrics = [
        { 
            label: "Orders Validating", 
            value: stats.ordersValidating || 0, 
            subtitle: "Awaiting verification",
            icon: Clock, 
            href: "/admin/orders",
            highlight: (stats.ordersValidating || 0) > 0,
            color: "text-amber-400"
        },
        { 
            label: "Active Campaigns", 
            value: stats.activeProducts, 
            subtitle: "Live in store",
            icon: ShoppingBag, 
            href: "/admin/products",
            color: "text-emerald-400"
        },
        { 
            label: "Pending Approvals", 
            value: stats.pendingProducts, 
            subtitle: "New vendor submissions",
            icon: AlertCircle, 
            href: "/admin/products",
            color: "text-blue-400"
        },
        { 
            label: "Total Customers", 
            value: stats.totalCustomers, 
            subtitle: "Active buyers",
            icon: Users, 
            href: "/admin/customers",
            color: "text-indigo-400"
        },
        { 
            label: "Pending Refunds", 
            value: stats.pendingRefunds, 
            subtitle: "Awaiting settlement",
            icon: Wallet, 
            href: "/admin/refunds",
            color: "text-purple-400"
        },
        { 
            label: "Review Queue", 
            value: `${stats.reviewQueuePending}P / ${stats.reviewQueueInProgress}IP`, 
            subtitle: "Pending / In-Progress",
            icon: CheckSquare, 
            href: "/admin/tasks",
            color: "text-cyan-400"
        },
        { 
            label: "WhatsApp Queue", 
            value: `${stats.whatsappQueuePending}P / ${stats.whatsappQueueInProgress}IP`, 
            subtitle: "Notification tasks",
            icon: MessageSquare, 
            href: "/admin/tasks",
            color: "text-pink-400"
        },
        { 
            label: "Total Refunded", 
            value: `₹${stats.totalRefunded.toLocaleString()}`, 
            subtitle: "Processed to date",
            icon: TrendingUp, 
            href: "/admin/refunds",
            color: "text-amber-300"
        },
    ];

    const totalOrders30d = analyticsData.signupTrend.reduce((sum, item) => sum + (item.orders || 0), 0);
    const totalSignups30d = analyticsData.signupTrend.reduce((sum, item) => sum + (item.signups || 0), 0);

    return (
        <div className="space-y-10 relative z-10 pb-16">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        Admin Portal
                    </h1>
                    <p className="text-xs sm:text-sm font-sans tracking-wide text-muted-foreground mt-1">
                        Platform Overview & Real-Time Operations Analytics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={handleForceSync} 
                        disabled={isSyncing}
                        className="border-border text-foreground hover:bg-accent/80 tracking-wide text-xs rounded-xl h-10 px-4 flex items-center gap-2 shadow-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Syncing Sheets..." : "Sync Sheets"}
                    </Button>
                </div>
            </div>

            {/* Skeleton Loading State */}
            {isLoading ? (
                <div className="space-y-8 animate-pulse">
                    <div className="h-16 bg-card/60 rounded-2xl border border-border"></div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-28 bg-card/60 rounded-2xl border border-border p-4 flex flex-col justify-between">
                                <div className="h-4 bg-muted rounded w-1/2"></div>
                                <div className="h-7 bg-muted rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="h-80 bg-card/60 rounded-2xl border border-border"></div>
                        <div className="h-80 bg-card/60 rounded-2xl border border-border"></div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Order Verification Attention Banner */}
                    {(stats.ordersValidating || 0) > 0 && (
                        <div className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-amber-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-sm tracking-tight flex items-center gap-2">
                                        Order Verification Required
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-mono">
                                            {stats.ordersValidating} Pending
                                        </Badge>
                                    </h3>
                                    <p className="text-muted-foreground text-xs mt-0.5">
                                        Orders awaiting manual review. Verifying an order automatically dispatches the customer confirmation email.
                                    </p>
                                </div>
                            </div>
                            <Button 
                                className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs tracking-wider uppercase h-10 px-5 rounded-xl shrink-0 shadow-xs flex items-center gap-2"
                                onClick={() => window.location.href = '/admin/orders?mode=dating'}
                            >
                                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                Speed Review Queue
                            </Button>
                        </div>
                    )}

                    {/* Core Metric Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {metrics.map((m, i) => {
                            const IconComponent = m.icon;
                            return (
                                <Link key={i} href={m.href} className="group">
                                    <Card className={`glass-panel border-border/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 p-5 h-full flex flex-col justify-between ${m.highlight ? 'ring-1 ring-amber-500/20 bg-amber-500/5' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-sans font-semibold tracking-wider text-muted-foreground uppercase">
                                                {m.label}
                                            </span>
                                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                <IconComponent className={`w-4 h-4 ${m.color}`} />
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <div className="text-2xl font-bold font-sans text-foreground tracking-tight">
                                                {m.value}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                                {m.subtitle}
                                                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-foreground/60" />
                                            </p>
                                        </div>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Analytics & Performance Charts */}
                    <div className="grid gap-6 md:grid-cols-2 pt-2">
                        {/* 30-Day Growth & Order Volume Chart */}
                        <Card className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        Platform Growth Trend
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                        Last 30 days continuous activity
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 text-xs">
                                    <button
                                        onClick={() => setSelectedMetric("orders")}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                            selectedMetric === "orders" 
                                                ? "bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white font-semibold shadow-xs" 
                                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                                        }`}
                                    >
                                        Orders ({totalOrders30d})
                                    </button>
                                    <button
                                        onClick={() => setSelectedMetric("signups")}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                            selectedMetric === "signups" 
                                                ? "bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white font-semibold shadow-xs" 
                                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                                        }`}
                                    >
                                        Signups ({totalSignups30d})
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="h-[280px] pt-2">
                                {analyticsData.signupTrend.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-xs text-foreground/40">
                                        No trend records available for this period.
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analyticsData.signupTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0}/>
                                                </linearGradient>
                                                <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                            <XAxis 
                                                dataKey="label" 
                                                stroke="#6B7280" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false} 
                                                interval={4}
                                            />
                                            <YAxis 
                                                stroke="#6B7280" 
                                                fontSize={10} 
                                                tickLine={false} 
                                                axisLine={false} 
                                                allowDecimals={false} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    borderRadius: '8px', 
                                                    border: '1px solid rgba(255,255,255,0.1)', 
                                                    backgroundColor: '#111827', 
                                                    color: '#fff',
                                                    fontSize: '12px'
                                                }} 
                                                labelStyle={{ color: '#9CA3AF', fontWeight: 'bold' }}
                                                formatter={(value: any) => [value, selectedMetric === "orders" ? "Orders Submitted" : "Customer Signups"]}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey={selectedMetric === "orders" ? "orders" : "signups"} 
                                                stroke={selectedMetric === "orders" ? "#d4af37" : "#3b82f6"} 
                                                strokeWidth={2.5} 
                                                fill={selectedMetric === "orders" ? "url(#primaryAreaGrad)" : "url(#blueAreaGrad)"}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Campaigns Performance Leaderboard */}
                        <Card className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-purple-500" />
                                        Top Performing Campaigns
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                        Slot allocations & fulfillment velocity
                                    </CardDescription>
                                </div>
                                <Link href="/admin/products" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium">
                                    View All <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-1">
                                {analyticsData.topProducts.length === 0 ? (
                                    <div className="h-[240px] flex flex-col items-center justify-center text-center text-muted-foreground text-xs">
                                        <ShoppingBasket className="w-8 h-8 mb-2 opacity-30" />
                                        No active campaigns found.
                                    </div>
                                ) : (
                                    analyticsData.topProducts.slice(0, 5).map((p, idx) => {
                                        const filledPercent = p.total_slots > 0 
                                            ? Math.min(100, Math.round((p.filled_slots / p.total_slots) * 100))
                                            : 0;
                                        return (
                                            <div 
                                                key={p.id || idx}
                                                className="p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors border border-border/60 flex items-center gap-3.5"
                                            >
                                                {/* Thumbnail */}
                                                <div className="w-11 h-11 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                                    {p.image ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag className="w-5 h-5 text-muted-foreground/40" />
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="text-xs font-semibold text-foreground truncate" title={p.name}>
                                                            {p.name}
                                                        </h4>
                                                        <span className="text-[11px] font-mono font-bold text-foreground shrink-0">
                                                            {p.orders} Orders
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                                                        <span>
                                                            {p.brand} • <strong className="text-foreground/80">{p.platform}</strong>
                                                        </span>
                                                        <span>
                                                            {p.filled_slots}/{p.total_slots} Slots ({filledPercent}%)
                                                        </span>
                                                    </div>

                                                    {/* Slot Progress Bar */}
                                                    <div className="w-full bg-muted dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                        <div 
                                                            className="bg-primary h-full rounded-full transition-all duration-500" 
                                                            style={{ width: `${Math.max(5, filledPercent)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Product Approvals */}
                    <div className="space-y-4 pt-6">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <h2 className="text-lg font-bold text-foreground tracking-wide flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                Pending Product Approvals ({pendingRequests.length})
                            </h2>
                            <Link href="/admin/products" className="text-xs text-muted-foreground hover:text-foreground">
                                Manage Products →
                            </Link>
                        </div>

                        {pendingRequests.length === 0 ? (
                            <Card className="p-8 text-center border border-border bg-card/60 rounded-2xl">
                                <p className="text-xs font-sans tracking-wide text-muted-foreground">
                                    No pending products awaiting approval. All vendor listings are up to date.
                                </p>
                            </Card>
                        ) : (
                            pendingRequests.map((req) => (
                                <Card key={req.id} className="p-5 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl shadow-xs">
                                    <div className="space-y-1">
                                        <h3 className="font-sans font-bold text-base text-foreground tracking-tight">{req.product_name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            By <span className="text-foreground font-medium">{req.brand}</span> • Platform: <strong className="text-foreground">{req.platform}</strong> • {req.total_slots} Total Slots • ₹{req.refund_amount}/Review
                                        </p>
                                    </div>
                                    <div className="flex gap-2.5 shrink-0">
                                        <Button 
                                            variant="outline" 
                                            className="border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/10 font-medium text-xs h-9 px-4 rounded-xl" 
                                            onClick={() => handleAction(req.id, "decline")}
                                        >
                                            Reject
                                        </Button>
                                        <Button 
                                            className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs h-9 px-5 rounded-xl shadow-xs" 
                                            onClick={() => handleAction(req.id, "approve")}
                                        >
                                            Approve Product
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Pending Refunds Action Queue */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-purple-400" />
                                Pending Refunds Queue ({stats.pendingRefunds})
                            </h2>
                            <Link href="/admin/refunds" className="text-xs text-muted-foreground hover:text-foreground">
                                Open Refunds Queue →
                            </Link>
                        </div>

                        {pendingRefundOrders.length === 0 ? (
                            <Card className="p-8 text-center glass-panel border-border">
                                <p className="text-xs font-sans tracking-wide text-muted-foreground">
                                    No pending refunds requiring action at this time.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pendingRefundOrders.map((req) => (
                                    <Card key={req.id} className="p-5 glass-panel border-border/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all rounded-2xl">
                                        <CardHeader className="p-0 pb-3">
                                            <CardTitle className="text-base font-bold text-foreground">
                                                Refund Amount: ₹{req.product?.refund_amount || req.amount}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0 space-y-2 text-xs">
                                            <p className="text-muted-foreground truncate">Product: <span className="text-foreground ml-1 font-medium">{req.product?.product_name}</span></p>
                                            <p className="text-muted-foreground font-mono">Order ID: <span className="text-foreground ml-1">{req.order_id}</span></p>
                                            <p className="text-muted-foreground">Customer: <span className="text-foreground ml-1 font-medium">{req.user?.mobile || req.user?.name}</span></p>
                                            <Button 
                                                className="w-full mt-3 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs tracking-wider uppercase h-9 rounded-xl flex items-center justify-center gap-1.5 shadow-xs" 
                                                onClick={() => window.location.href = '/admin/refunds?mode=dating'}
                                            >
                                                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                                                Speed Payout Deck
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Order Activity */}
                    <div className="space-y-4 pt-4 pb-8">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Recent Order Activity
                            </h2>
                            <Link href="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground">
                                View All Orders →
                            </Link>
                        </div>

                        {recentOrders.length === 0 ? (
                            <Card className="p-8 text-center border border-border bg-card/60 rounded-2xl">
                                <p className="text-xs font-sans tracking-wide text-muted-foreground">
                                    No orders submitted yet today.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {recentOrders.map((req) => (
                                    <Card key={req.id} className="p-5 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400/50 transition-all rounded-2xl shadow-xs">
                                        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
                                            <CardTitle className="text-xs font-mono font-bold text-foreground">
                                                Order <span>{req.order_id}</span>
                                            </CardTitle>
                                            <Badge variant="outline" className="text-[10px] bg-muted/60 border-border text-foreground">
                                                {req.status}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="p-0 space-y-2 text-xs">
                                            <p className="text-muted-foreground truncate">Product: <span className="text-foreground ml-1 font-medium">{req.product?.product_name}</span></p>
                                            <p className="text-muted-foreground">Customer: <span className="text-foreground ml-1">{req.user?.name || req.user?.mobile}</span></p>
                                            <p className="text-muted-foreground">Amount: <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold ml-1">₹{req.amount}</span></p>
                                            <Button 
                                                variant="outline"
                                                className="w-full mt-3 border-border hover:bg-muted text-foreground font-medium text-xs h-9 rounded-xl transition-colors" 
                                                onClick={() => window.location.href = '/admin/orders'}
                                            >
                                                Review Order
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

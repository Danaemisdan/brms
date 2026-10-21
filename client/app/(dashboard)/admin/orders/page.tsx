"use client";

import { apiFetch } from "@/lib/apiFetch";
import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isDateMatch, DateFilterType } from "@/lib/dateUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
    CheckCircle2, 
    Clock, 
    XCircle, 
    AlertTriangle, 
    Sparkles, 
    Wallet, 
    Download, 
    Search, 
    Mail, 
    ExternalLink, 
    ShieldCheck,
    ChevronDown,
    Filter,
    Copy,
    Check,
    ChevronLeft,
    ChevronRight,
    X,
    Zap,
    Maximize2
} from "lucide-react";

const API_URL = "";

// The 7 official order status remarks
export const ORDER_STATUS_REMARKS = [
    "Order Validating",
    "Order Confirmed (dating)",
    "Order Cancelled",
    "Order Rejected (No More Slots)",
    "Order Approved (After Submission of Review SS & Return Window SS)",
    "Refund Processing (15 days of Order Confirmation)",
    "Refund Reject, Wrong Written"
] as const;

export default function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState<DateFilterType>("ALL");

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [savedReasons, setSavedReasons] = useState<string[]>([]);

    // Speed Review Queue ("Dating Mode") state
    const [isDatingQueueOpen, setIsDatingQueueOpen] = useState(false);
    const [datingIndex, setDatingIndex] = useState(0);
    const [datingRejectReason, setDatingRejectReason] = useState("");
    const [isRejectingInDating, setIsRejectingInDating] = useState(false);
    const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
    const [datingActiveProof, setDatingActiveProof] = useState<"screenshot" | "delivery" | "return">("screenshot");

    // Orders awaiting verification for dating mode
    const validatingOrders = orders.filter(
        o => o.status === "Order Validating" || o.status === "SUBMITTED"
    );

    // Check if ?mode=dating was requested in URL
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("mode") === "dating") {
                setIsDatingQueueOpen(true);
            }
        }
    }, []);

    // Ensure dating index is clamped
    useEffect(() => {
        if (validatingOrders.length > 0 && datingIndex >= validatingOrders.length) {
            setDatingIndex(Math.max(0, validatingOrders.length - 1));
        }
    }, [validatingOrders.length, datingIndex]);

    const updateOrderStatus = async (id: string, newStatus: string, remarks?: string) => {
        setIsUpdating(id);
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/orders/${id}/status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus, remarks: remarks || newStatus })
            });
            if (res.ok) {
                if (newStatus === "Order Confirmed (dating)" || newStatus === "Order Confirmed") {
                    toast.success("Order verified! Confirmation email automatically dispatched to customer.");
                } else {
                    toast.success(`Order status updated to "${newStatus}"`);
                }
                
                if (newStatus.includes('Reject') && remarks && remarks.trim() !== '') {
                    const trimmedReason = remarks.trim();
                    setSavedReasons(prev => {
                        const newSaved = prev.includes(trimmedReason) 
                            ? prev 
                            : [trimmedReason, ...prev].slice(0, 10);
                        localStorage.setItem("savedRejectReasons", JSON.stringify(newSaved));
                        return newSaved;
                    });
                }
                setRejectOrderId(null);
                setRejectReason("");
                await fetchOrders();
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.error || "Failed to update order status");
            }
        } catch (error) {
            toast.error("Error updating order status");
        } finally {
            setIsUpdating(null);
        }
    };

    const handleDatingApprove = async (orderId: string) => {
        await updateOrderStatus(orderId, 'Order Confirmed (dating)');
        setIsRejectingInDating(false);
        setDatingRejectReason("");
    };

    const handleDatingNoSlots = async (orderId: string) => {
        await updateOrderStatus(orderId, 'Order Rejected (No More Slots)', 'No slots available for this campaign');
        setIsRejectingInDating(false);
        setDatingRejectReason("");
    };

    const handleDatingReject = async (orderId: string) => {
        if (!datingRejectReason.trim()) {
            toast.error("Please enter or choose a rejection remark");
            return;
        }
        await updateOrderStatus(orderId, 'Refund Reject, Wrong Written', datingRejectReason.trim());
        setDatingRejectReason("");
        setIsRejectingInDating(false);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedOrderId(id);
        toast.success("Order ID copied to clipboard!");
        setTimeout(() => setCopiedOrderId(null), 2000);
    };

    // Keyboard shortcuts for Dating Mode
    useEffect(() => {
        if (!isDatingQueueOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            if (e.key === 'Escape') {
                if (isRejectingInDating) {
                    setIsRejectingInDating(false);
                } else {
                    setIsDatingQueueOpen(false);
                }
                return;
            }

            if (isTyping) {
                if (e.key === 'Enter' && isRejectingInDating) {
                    e.preventDefault();
                    const current = validatingOrders[datingIndex];
                    if (current && datingRejectReason.trim()) {
                        handleDatingReject(current.id);
                    }
                }
                return;
            }

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                setDatingIndex(prev => Math.min(prev + 1, Math.max(0, validatingOrders.length - 1)));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setDatingIndex(prev => Math.max(0, prev - 1));
            } else if (e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                const current = validatingOrders[datingIndex];
                if (current && isUpdating !== current.id) {
                    handleDatingApprove(current.id);
                }
            } else if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                const current = validatingOrders[datingIndex];
                if (current && isUpdating !== current.id) {
                    handleDatingNoSlots(current.id);
                }
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                setDatingRejectReason("Wrong review written or screenshots do not match");
                setIsRejectingInDating(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDatingQueueOpen, datingIndex, validatingOrders, isUpdating, isRejectingInDating, datingRejectReason]);

    // Fast Wallet Credit action via developer API
    const handleCreditWallet = async (orderId: string) => {
        setIsUpdating(orderId);
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/v1/wallet/credit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ order_id: orderId })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(`Wallet credited: ₹${data.credited_amount}. Order in Refund Processing.`);
                await fetchOrders();
            } else {
                toast.error(data.error || "Wallet credit failed. Ensure order is approved.");
            }
        } catch (err) {
            toast.error("Failed to execute wallet settlement");
        } finally {
            setIsUpdating(null);
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem("savedRejectReasons");
        if (saved) {
            try {
                setSavedReasons(JSON.parse(saved));
            } catch (e) {
                // ignore
            }
        }
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
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Order Validating":
            case "SUBMITTED":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Order Validating
                    </span>
                );
            case "Order Confirmed (dating)":
            case "Order Confirmed":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Order Confirmed
                    </span>
                );
            case "Order Cancelled":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                        <XCircle className="w-3.5 h-3.5" />
                        Order Cancelled
                    </span>
                );
            case "Order Rejected (No More Slots)":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Rejected (No Slots)
                    </span>
                );
            case "Order Approved (After Submission of Review SS & Return Window SS)":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        Order Approved (Proofs OK)
                    </span>
                );
            case "Refund Processing (15 days of Order Confirmation)":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Wallet className="w-3.5 h-3.5" />
                        Refund Processing (15d)
                    </span>
                );
            case "Refund Reject, Wrong Written":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Refund Reject (Wrong Written)
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-foreground/5 text-foreground/70 border border-border/10">
                        {status}
                    </span>
                );
        }
    };

    // Counts for stat bar
    const validatingCount = orders.filter(o => o.status === "Order Validating" || o.status === "SUBMITTED").length;
    const confirmedCount = orders.filter(o => o.status === "Order Confirmed (dating)" || o.status === "Order Confirmed").length;
    const approvedCount = orders.filter(o => o.status === "Order Approved (After Submission of Review SS & Return Window SS)").length;
    const refundProcessingCount = orders.filter(o => o.status === "Refund Processing (15 days of Order Confirmation)").length;

    return (
        <div className="space-y-8 relative z-10 pb-16">
            {/* Header section with refined aesthetics */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border/60 pb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                            Order Operations
                        </h1>
                        <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-semibold rounded-full">
                            Live Sync
                        </span>
                    </div>
                    <p className="text-muted-foreground mt-1.5 font-sans tracking-wide text-xs sm:text-sm max-w-2xl leading-relaxed">
                        Manual review, slot validation & automated email confirmation engine. Customers receive confirmation emails once verified.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Button 
                        onClick={() => { setDatingIndex(0); setIsDatingQueueOpen(true); }}
                        className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs tracking-wider uppercase h-11 px-5 rounded-xl transition-all shadow-sm border border-zinc-800 dark:border-zinc-200 flex items-center gap-2 group"
                    >
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
                        Speed Review Queue ({validatingCount})
                    </Button>
                    <Button 
                        variant="outline" 
                        className="bg-card hover:bg-accent/80 text-foreground border border-border shadow-xs font-medium text-xs tracking-wider uppercase h-11 px-5 rounded-xl transition-all flex items-center gap-2" 
                        onClick={() => window.open(`${API_URL}/api/orders/export?token=brms_export_secret_123`, "_blank")}
                    >
                        <Download className="w-4 h-4 text-muted-foreground" />
                        Export Orders (CSV)
                    </Button>
                </div>
            </div>

            {/* Speed Review Attention Banner */}
            {validatingCount > 0 && (
                <div className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-amber-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground text-sm tracking-tight flex items-center gap-2">
                                {validatingCount} Order{validatingCount > 1 ? "s" : ""} Awaiting Manual Review & Confirmation
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-mono">
                                    Speed Mode Ready
                                </Badge>
                            </h3>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                Launch the card-by-card Speed Review Queue to verify order proofs, check remaining slots, and automatically dispatch confirmation emails.
                            </p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => { setDatingIndex(0); setIsDatingQueueOpen(true); }}
                        className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs tracking-wider uppercase h-10 px-5 rounded-xl shrink-0 shadow-xs flex items-center gap-2"
                    >
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        Launch Speed Queue
                    </Button>
                </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card 
                    className="p-4 glass-panel border-amber-500/20 bg-amber-500/5 cursor-pointer hover:border-amber-500/40 transition-all rounded-2xl"
                    onClick={() => setStatusFilter("Order Validating")}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Awaiting Verification</span>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground mt-2">{validatingCount}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Ready for manual confirmation</div>
                </Card>

                <Card 
                    className="p-4 glass-panel border-emerald-500/20 bg-emerald-500/5 cursor-pointer hover:border-emerald-500/40 transition-all rounded-2xl"
                    onClick={() => setStatusFilter("Order Confirmed (dating)")}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Order Confirmed</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground mt-2">{confirmedCount}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Verification emails sent</div>
                </Card>

                <Card 
                    className="p-4 glass-panel border-teal-500/20 bg-teal-500/5 cursor-pointer hover:border-teal-500/40 transition-all rounded-2xl"
                    onClick={() => setStatusFilter("Order Approved (After Submission of Review SS & Return Window SS)")}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Approved Proofs</span>
                        <Sparkles className="w-4 h-4 text-teal-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground mt-2">{approvedCount}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Review & Return SS Verified</div>
                </Card>

                <Card 
                    className="p-4 glass-panel border-purple-500/20 bg-purple-500/5 cursor-pointer hover:border-purple-500/40 transition-all rounded-2xl"
                    onClick={() => setStatusFilter("Refund Processing (15 days of Order Confirmation)")}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Refund Processing</span>
                        <Wallet className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground mt-2">{refundProcessingCount}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Wallet credited / 15-day cycle</div>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <Card className="p-5 glass-panel border-border space-y-4 rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 relative w-full">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                            placeholder="Search Order ID, mobile, email, customer, or product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl text-xs sm:text-sm font-sans"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            className="h-11 rounded-xl border border-border bg-card px-3 text-foreground text-xs font-sans outline-none focus:border-zinc-400 dark:focus:border-zinc-600 tracking-wide uppercase flex-1 md:w-[220px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Statuses ({orders.length})</option>
                            <option value="Order Validating">1. Order Validating ({validatingCount})</option>
                            <option value="Order Confirmed (dating)">2. Order Confirmed ({confirmedCount})</option>
                            <option value="Order Cancelled">3. Order Cancelled</option>
                            <option value="Order Rejected (No More Slots)">4. Rejected (No More Slots)</option>
                            <option value="Order Approved (After Submission of Review SS & Return Window SS)">5. Order Approved (Proofs Verified)</option>
                            <option value="Refund Processing (15 days of Order Confirmation)">6. Refund Processing (15d)</option>
                            <option value="Refund Reject, Wrong Written">7. Refund Reject (Wrong Written)</option>
                        </select>
                        <select
                            className="h-11 rounded-xl border border-border bg-card px-3 text-foreground text-xs font-sans outline-none focus:border-zinc-400 dark:focus:border-zinc-600 tracking-wide uppercase flex-1 md:w-[160px]"
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
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    <span className="text-muted-foreground text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
                        <Filter className="w-3 h-3" /> Quick Filter:
                    </span>
                    <button 
                        onClick={() => setStatusFilter("ALL")}
                        className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === 'ALL' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs' : 'bg-muted/70 text-muted-foreground hover:bg-muted'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setStatusFilter("Order Validating")}
                        className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === 'Order Validating' ? 'bg-amber-500 text-black font-semibold shadow-xs' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'}`}
                    >
                        Validating ({validatingCount})
                    </button>
                    <button 
                        onClick={() => setStatusFilter("Order Confirmed (dating)")}
                        className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === 'Order Confirmed (dating)' ? 'bg-emerald-600 text-white font-semibold shadow-xs' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'}`}
                    >
                        Confirmed ({confirmedCount})
                    </button>
                    <button 
                        onClick={() => setStatusFilter("Order Approved (After Submission of Review SS & Return Window SS)")}
                        className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${statusFilter.includes('Approved') ? 'bg-teal-600 text-white font-semibold shadow-xs' : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20'}`}
                    >
                        Approved ({approvedCount})
                    </button>
                    <button 
                        onClick={() => setStatusFilter("Refund Processing (15 days of Order Confirmation)")}
                        className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${statusFilter.includes('Refund Processing') ? 'bg-purple-600 text-white font-semibold shadow-xs' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20'}`}
                    >
                        Refund Processing ({refundProcessingCount})
                    </button>
                </div>
            </Card>

            {/* Orders Feed */}
            <div className="space-y-4">
                {isLoading ? (
                    <Card className="p-16 text-center glass-panel border-white/5">
                        <Clock className="w-8 h-8 text-primary/60 mx-auto animate-spin mb-3" />
                        <p className="text-primary/70 font-sans tracking-widest text-xs uppercase">Loading order records...</p>
                    </Card>
                ) : (() => {
                    const filteredOrders = orders.filter(order => {
                        const searchStr = searchTerm.toLowerCase();
                        const matchesSearch =
                            (order.order_id?.toLowerCase() || "").includes(searchStr) ||
                            (order.user?.mobile || "").includes(searchStr) ||
                            (order.user?.email || "").toLowerCase().includes(searchStr) ||
                            (order.user?.name || "").toLowerCase().includes(searchStr) ||
                            (order.product?.product_name?.toLowerCase() || "").includes(searchStr);

                        const matchesStatus = 
                            statusFilter === "ALL" || 
                            order.status === statusFilter ||
                            (statusFilter === "Order Validating" && order.status === "SUBMITTED") ||
                            (statusFilter === "Order Confirmed (dating)" && order.status === "Order Confirmed");

                        const matchesDate = isDateMatch(order.created_at, dateFilter);

                        return matchesSearch && matchesStatus && matchesDate;
                    });

                    if (filteredOrders.length === 0) {
                        return (
                            <Card className="p-16 text-center glass-panel border-white/5">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-foreground/40">
                                    <Search className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground/80">No orders found</h3>
                                <p className="text-foreground/40 font-sans text-xs mt-1">Try adjusting your search criteria or status filter.</p>
                            </Card>
                        );
                    }

                    return filteredOrders.map((order) => {
                        const isPendingValidation = order.status === "Order Validating" || order.status === "SUBMITTED";
                        const isConfirmed = order.status === "Order Confirmed (dating)" || order.status === "Order Confirmed";
                        const isApproved = order.status === "Order Approved (After Submission of Review SS & Return Window SS)";
                        const hasEmail = Boolean(order.user?.email);

                        return (
                            <Card 
                                key={order.id} 
                                className="p-6 glass-panel border-border/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all rounded-2xl shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
                            >
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <CardTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                                            {order.product?.product_name || "Unknown Product"}
                                        </CardTitle>
                                        {getStatusBadge(order.status)}
                                        {order.product?.platform && (
                                            <span className="text-[11px] font-mono bg-muted border border-border px-2 py-0.5 rounded text-foreground/70">
                                                {order.product.platform}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-sans">
                                        <span className="font-semibold text-foreground">
                                            Customer: {order.user?.name || "Guest"} ({order.user?.mobile})
                                        </span>
                                        {order.user?.email && (
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Mail className="w-3 h-3" /> {order.user.email}
                                            </span>
                                        )}
                                        {order.profile_name && (
                                            <span className="bg-muted text-foreground border border-border px-2 py-0.5 rounded text-[11px] font-mono">
                                                Profile: {order.profile_name}
                                            </span>
                                        )}
                                        <span className="font-mono text-muted-foreground">
                                            Order ID: <strong className="text-foreground">{order.order_id}</strong>
                                        </span>
                                        <span>
                                            Date: {new Date(order.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-emerald-500 font-semibold font-mono">
                                            Refund: ₹{order.product?.refund_amount || order.amount}
                                        </span>
                                    </div>

                                    {/* Remarks details */}
                                    {order.remarks && order.remarks !== order.status && (
                                        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg max-w-xl">
                                            <strong>Remark:</strong> {order.remarks}
                                        </div>
                                    )}

                                    {/* Proof Image trigger */}
                                    {order.screenshot_url && order.screenshot_url !== "https://dummyimage.com/600x400/000/fff&text=Order+Screenshot" && (
                                        <button 
                                            onClick={() => setSelectedImage(order.screenshot_url)} 
                                            className="text-xs text-muted-foreground hover:text-foreground tracking-wide font-sans inline-flex items-center gap-1.5 underline underline-offset-4 pt-1"
                                        >
                                            <ExternalLink className="w-3 h-3" /> View Submitted Proof Screenshot
                                        </button>
                                    )}
                                </div>

                                {/* Actions & Status Controllers */}
                                <div className="flex flex-col gap-3 min-w-[280px] lg:items-end border-t lg:border-t-0 pt-4 lg:pt-0 border-border/50">
                                    {/* Fast Action Buttons for Order Validating */}
                                    {isPendingValidation && (
                                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                                            <Button 
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wide h-9 flex-1 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                                                disabled={isUpdating === order.id}
                                                onClick={() => updateOrderStatus(order.id, 'Order Confirmed (dating)')}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Confirm & Email
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium text-xs tracking-wide h-9 rounded-xl flex items-center justify-center gap-1.5"
                                                disabled={isUpdating === order.id}
                                                onClick={() => updateOrderStatus(order.id, 'Order Rejected (No More Slots)', 'No slots available for this campaign')}
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                No Slots
                                            </Button>
                                        </div>
                                    )}

                                    {/* Fast Action for Confirmed Orders -> Approve Proofs */}
                                    {isConfirmed && (
                                        <div className="w-full">
                                            <Button 
                                                size="sm"
                                                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs tracking-wide h-9 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                                                disabled={isUpdating === order.id}
                                                onClick={() => updateOrderStatus(order.id, 'Order Approved (After Submission of Review SS & Return Window SS)')}
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Approve Review & Return SS
                                            </Button>
                                        </div>
                                    )}

                                    {/* Fast Action for Approved Orders -> Credit Wallet */}
                                    {isApproved && (
                                        <div className="w-full">
                                            <Button 
                                                size="sm"
                                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs tracking-wide h-9 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                                                disabled={isUpdating === order.id}
                                                onClick={() => handleCreditWallet(order.id)}
                                            >
                                                <Wallet className="w-3.5 h-3.5" />
                                                Credit Wallet (₹{order.product?.refund_amount || order.amount})
                                            </Button>
                                        </div>
                                    )}

                                    {/* Comprehensive Status Remark Dropdown */}
                                    <div className="w-full space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">
                                            Update Status Remark:
                                        </label>
                                        <div className="relative">
                                            <select 
                                                className="h-9 w-full text-xs bg-card border border-border rounded-xl px-2.5 text-foreground appearance-none outline-none focus:border-zinc-400 dark:focus:border-zinc-600 pr-8"
                                                value={order.status}
                                                disabled={isUpdating === order.id}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "Refund Reject, Wrong Written") {
                                                        setRejectOrderId(order.id);
                                                        setRejectReason("Wrong review written or screenshots do not match");
                                                    } else {
                                                        updateOrderStatus(order.id, val);
                                                    }
                                                }}
                                            >
                                                {ORDER_STATUS_REMARKS.map((remark) => (
                                                    <option key={remark} value={remark}>
                                                        {remark}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    });
                })()}
            </div>

            {/* SPEED REVIEW QUEUE (DATING MODE) FULLSCREEN DIALOG */}
            <Dialog open={isDatingQueueOpen} onOpenChange={setIsDatingQueueOpen}>
                <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] flex flex-col bg-neutral-950/98 border border-white/10 p-0 rounded-2xl shadow-2xl overflow-hidden text-foreground">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                                <Zap className="w-4 h-4 fill-amber-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-sans font-extrabold text-primary tracking-wider uppercase flex items-center gap-2">
                                    Speed Review Queue (Dating Mode)
                                    {validatingOrders.length > 0 && (
                                        <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-mono">
                                            Card {datingIndex + 1} of {validatingOrders.length}
                                        </Badge>
                                    )}
                                </DialogTitle>
                                <p className="text-[11px] text-foreground/50">
                                    1-Click Slot Validation & Instant Customer Confirmation Email Engine
                                </p>
                            </div>
                        </div>

                        {validatingOrders.length > 0 && (
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-mono text-foreground/50">
                                        {Math.round(((datingIndex + 1) / validatingOrders.length) * 100)}% Reviewed
                                    </span>
                                    <div className="w-32 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-amber-500 h-full transition-all duration-300"
                                            style={{ width: `${((datingIndex + 1) / validatingOrders.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Body */}
                    {validatingOrders.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center space-y-4 my-auto">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold font-sans text-primary">All Validating Orders Reviewed!</h3>
                            <p className="text-foreground/60 text-sm max-w-md">
                                The verification queue is all caught up. All incoming orders have been validated, slot reservations accounted for, and customer confirmation emails dispatched.
                            </p>
                            <Button 
                                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 font-semibold text-xs tracking-wider uppercase h-10 px-6 rounded-lg mt-2"
                                onClick={() => setIsDatingQueueOpen(false)}
                            >
                                Return to Order Table
                            </Button>
                        </div>
                    ) : (() => {
                        const currentOrder = validatingOrders[datingIndex] || validatingOrders[0];
                        const totalSlots = currentOrder?.product?.total_slots ?? 0;
                        const filledSlots = currentOrder?.product?.filled_slots ?? 0;
                        const remainingSlots = Math.max(0, totalSlots - filledSlots);
                        const isSlotsExhausted = remainingSlots <= 0;

                        let activeImageUrl = currentOrder?.screenshot_url;
                        if (datingActiveProof === "delivery" && currentOrder?.delivery_screenshot_url) {
                            activeImageUrl = currentOrder.delivery_screenshot_url;
                        } else if (datingActiveProof === "return" && currentOrder?.return_window_screenshot_url) {
                            activeImageUrl = currentOrder.return_window_screenshot_url;
                        }

                        return (
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[60vh]">
                                    {/* Left Column: Proof Viewer */}
                                    <div className="space-y-3 flex flex-col">
                                        <div className="relative group bg-black/60 rounded-xl border border-white/10 flex items-center justify-center p-3 min-h-[320px] max-h-[440px] overflow-hidden">
                                            {activeImageUrl && activeImageUrl !== "https://dummyimage.com/600x400/000/fff&text=Order+Screenshot" ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img 
                                                    src={activeImageUrl} 
                                                    alt="Order Proof"
                                                    className="max-h-[420px] w-auto max-w-full object-contain rounded-lg shadow-md cursor-pointer hover:scale-[1.01] transition-transform duration-200"
                                                    onClick={() => setSelectedImage(activeImageUrl)}
                                                />
                                            ) : (
                                                <div className="text-foreground/40 text-xs flex flex-col items-center gap-2 py-12">
                                                    <AlertTriangle className="w-8 h-8 text-amber-500/60" />
                                                    <span>No high-resolution screenshot attached</span>
                                                </div>
                                            )}

                                            {activeImageUrl && activeImageUrl !== "https://dummyimage.com/600x400/000/fff&text=Order+Screenshot" && (
                                                <button 
                                                    onClick={() => setSelectedImage(activeImageUrl)}
                                                    className="absolute top-3 right-3 bg-black/80 hover:bg-black text-white/80 hover:text-white p-2 rounded-lg border border-white/10 transition-colors shadow-lg"
                                                    title="View Full Resolution"
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Proof Switcher Buttons */}
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setDatingActiveProof("screenshot")}
                                                className={`text-xs px-3 py-1 rounded-md border font-sans transition-all ${datingActiveProof === 'screenshot' ? 'bg-primary/20 text-primary border-primary/40 font-semibold' : 'bg-white/5 text-foreground/50 border-white/5 hover:bg-white/10'}`}
                                            >
                                                Order Proof
                                            </button>
                                            {currentOrder?.delivery_screenshot_url && (
                                                <button 
                                                    onClick={() => setDatingActiveProof("delivery")}
                                                    className={`text-xs px-3 py-1 rounded-md border font-sans transition-all ${datingActiveProof === 'delivery' ? 'bg-primary/20 text-primary border-primary/40 font-semibold' : 'bg-white/5 text-foreground/50 border-white/5 hover:bg-white/10'}`}
                                                >
                                                    Delivery Proof
                                                </button>
                                            )}
                                            {currentOrder?.return_window_screenshot_url && (
                                                <button 
                                                    onClick={() => setDatingActiveProof("return")}
                                                    className={`text-xs px-3 py-1 rounded-md border font-sans transition-all ${datingActiveProof === 'return' ? 'bg-primary/20 text-primary border-primary/40 font-semibold' : 'bg-white/5 text-foreground/50 border-white/5 hover:bg-white/10'}`}
                                                >
                                                    Return Window Proof
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Order Details & Slot Engine */}
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                {currentOrder?.product?.platform && (
                                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-mono uppercase">
                                                        {currentOrder.product.platform}
                                                    </Badge>
                                                )}
                                                {currentOrder?.product?.brand && (
                                                    <span className="text-xs text-foreground/60 font-semibold uppercase tracking-wider">
                                                        {currentOrder.product.brand}
                                                    </span>
                                                )}
                                                <span className="text-[11px] font-mono text-foreground/40 ml-auto">
                                                    Submitted: {new Date(currentOrder?.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h2 className="text-lg font-bold font-sans text-primary leading-snug">
                                                {currentOrder?.product?.product_name || "Unknown Product"}
                                            </h2>
                                        </div>

                                        {/* Order ID & Refund Amount Highlights */}
                                        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                                            <div>
                                                <span className="text-[10px] font-mono text-foreground/50 uppercase tracking-wider block">Order ID</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="font-mono text-xs font-bold text-white tracking-wide truncate">
                                                        {currentOrder?.order_id}
                                                    </span>
                                                    <button 
                                                        onClick={() => copyToClipboard(currentOrder?.order_id, currentOrder?.id)}
                                                        className="text-foreground/40 hover:text-primary transition-colors p-1"
                                                        title="Copy Order ID"
                                                    >
                                                        {copiedOrderId === currentOrder?.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-mono text-foreground/50 uppercase tracking-wider block">Refund Amount</span>
                                                <span className="font-mono text-base font-extrabold text-emerald-400 block mt-0.5">
                                                    ₹{currentOrder?.product?.refund_amount || currentOrder?.amount}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Slot Validation Metric Box */}
                                        <div className={`p-4 rounded-xl border transition-all ${isSlotsExhausted ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                                    <ShieldCheck className={`w-3.5 h-3.5 ${isSlotsExhausted ? 'text-red-400' : 'text-emerald-400'}`} />
                                                    Campaign Slots Engine
                                                </span>
                                                <span className={`font-mono font-bold text-xs ${isSlotsExhausted ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {isSlotsExhausted ? "SLOTS EXHAUSTED" : `${remainingSlots} Slots Available`}
                                                </span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-2">
                                                <div 
                                                    className={`h-full transition-all duration-300 ${isSlotsExhausted ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${totalSlots > 0 ? Math.min(100, (filledSlots / totalSlots) * 100) : 0}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[11px] font-mono text-foreground/60">
                                                <span>Total: {totalSlots}</span>
                                                <span>Filled: {filledSlots}</span>
                                                <span className={isSlotsExhausted ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                                                    Remaining: {remainingSlots}
                                                </span>
                                            </div>
                                            {isSlotsExhausted && (
                                                <div className="mt-2 text-[11px] text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                    <span>Slot limit reached. Click "No More Slots" or approving will automatically route to Refund Entry workflow.</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Customer Details Box */}
                                        <div className="space-y-2 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-zinc-400">Customer Name:</span>
                                                <span className="font-semibold text-white">{currentOrder?.user?.name || "Guest"}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-zinc-400">Mobile:</span>
                                                <span className="font-mono font-medium text-white">{currentOrder?.user?.mobile}</span>
                                            </div>
                                            {currentOrder?.user?.email && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-zinc-400">Email Notification:</span>
                                                    <a href={`mailto:${currentOrder.user.email}`} className="text-zinc-200 hover:text-white flex items-center gap-1 font-mono text-[11px] underline">
                                                        <Mail className="w-3 h-3 text-zinc-400" /> {currentOrder.user.email}
                                                    </a>
                                                </div>
                                            )}
                                            {currentOrder?.profile_name && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-zinc-400">E-Commerce Profile:</span>
                                                    <span className="text-white font-mono">{currentOrder.profile_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {currentOrder?.remarks && currentOrder.remarks !== currentOrder.status && (
                                            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                                                <strong>Existing Remark:</strong> {currentOrder.remarks}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Action Area */}
                                {isRejectingInDating ? (
                                    <div className="p-4 bg-neutral-900 border-t border-white/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <AlertTriangle className="w-4 h-4" /> Specify Rejection Reason (Visible to Customer)
                                            </span>
                                            <button 
                                                onClick={() => setIsRejectingInDating(false)} 
                                                className="text-zinc-400 hover:text-white text-xs"
                                            >
                                                Cancel [Esc]
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {["Wrong Order ID / Duplicate", "Screenshot blurry / invalid", "Price / Product mismatch", "Wrong platform order", "Review not verified", "Fake Order"].map((preset, idx) => (
                                                <Badge 
                                                    key={idx} 
                                                    variant="outline" 
                                                    className="cursor-pointer hover:bg-white/10 hover:text-white text-[11px] py-1 px-2.5 border-zinc-700 text-zinc-300"
                                                    onClick={() => setDatingRejectReason(preset)}
                                                >
                                                    {preset}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input 
                                                autoFocus
                                                placeholder="Type rejection remark visible to customer... (Press Enter to submit)"
                                                value={datingRejectReason}
                                                onChange={(e) => setDatingRejectReason(e.target.value)}
                                                className="bg-white/5 border-white/15 text-white h-11 text-xs rounded-xl flex-1"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && datingRejectReason.trim()) {
                                                        e.preventDefault();
                                                        handleDatingReject(currentOrder.id);
                                                    }
                                                }}
                                            />
                                            <Button 
                                                className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-semibold text-xs h-11 px-5 rounded-xl uppercase tracking-wider"
                                                disabled={!datingRejectReason.trim() || isUpdating === currentOrder.id}
                                                onClick={() => handleDatingReject(currentOrder.id)}
                                            >
                                                Submit Rejection
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-neutral-900/90 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            disabled={datingIndex === 0}
                                            onClick={() => setDatingIndex(prev => Math.max(0, prev - 1))}
                                            className="border-white/10 text-foreground/70 hover:text-white h-11 px-4 rounded-xl flex items-center gap-1.5 text-xs font-mono w-full sm:w-auto justify-center"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Previous
                                        </Button>

                                        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 justify-center max-w-xl">
                                            {/* APPROVE */}
                                            <Button 
                                                disabled={isUpdating === currentOrder.id}
                                                onClick={() => handleDatingApprove(currentOrder.id)}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide h-12 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] flex flex-col items-center justify-center transition-all group"
                                            >
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>Approve & Confirm</span>
                                                    <kbd className="text-[10px] font-mono bg-emerald-700/60 px-1.5 py-0.5 rounded ml-1">A</kbd>
                                                </div>
                                                <span className="text-[10px] text-emerald-100/70 font-normal">Verifies slot & sends email</span>
                                            </Button>

                                            {/* NO MORE SLOTS */}
                                            <Button 
                                                variant="outline"
                                                disabled={isUpdating === currentOrder.id}
                                                onClick={() => handleDatingNoSlots(currentOrder.id)}
                                                className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-semibold text-xs tracking-wide h-12 px-4 rounded-xl flex flex-col items-center justify-center transition-all"
                                            >
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                                    <span>No More Slots</span>
                                                    <kbd className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded ml-1">S</kbd>
                                                </div>
                                                <span className="text-[10px] text-amber-400/60 font-normal">Routes to refund</span>
                                            </Button>

                                            {/* REJECT */}
                                            <Button 
                                                variant="outline"
                                                disabled={isUpdating === currentOrder.id}
                                                onClick={() => {
                                                    setDatingRejectReason("Wrong review written or screenshots do not match");
                                                    setIsRejectingInDating(true);
                                                }}
                                                className="border-zinc-700 text-zinc-300 hover:text-rose-400 hover:bg-rose-500/10 font-semibold text-xs tracking-wide h-12 px-4 rounded-xl flex flex-col items-center justify-center transition-all"
                                            >
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <XCircle className="w-3.5 h-3.5 text-zinc-400" />
                                                    <span>Reject</span>
                                                    <kbd className="text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded ml-1">R</kbd>
                                                </div>
                                                <span className="text-[10px] text-zinc-400 font-normal">Type custom reason</span>
                                            </Button>
                                        </div>

                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            disabled={datingIndex >= validatingOrders.length - 1}
                                            onClick={() => setDatingIndex(prev => Math.min(prev + 1, validatingOrders.length - 1))}
                                            className="border-white/10 text-foreground/70 hover:text-white h-11 px-4 rounded-xl flex items-center gap-1.5 text-xs font-mono w-full sm:w-auto justify-center"
                                        >
                                            Next <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}

                                {/* Footer Shortcut Legend */}
                                <div className="bg-black/80 px-4 py-2 border-t border-white/5 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-foreground/50">
                                    <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">A</kbd> Approve & Send Email</span>
                                    <span>•</span>
                                    <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">S</kbd> No Slots</span>
                                    <span>•</span>
                                    <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">R</kbd> Reject with Reason</span>
                                    <span>•</span>
                                    <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">←</kbd> <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">→</kbd> Navigate</span>
                                    <span>•</span>
                                    <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">Esc</kbd> Close</span>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Proof Image Lightbox Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col items-center justify-center bg-black/95 border-border/10 p-6 rounded-2xl">
                    <DialogHeader className="w-full mb-3 flex flex-row items-center justify-between">
                        <DialogTitle className="text-white/90 font-mono text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            Submitted Order Proof Screenshot
                        </DialogTitle>
                    </DialogHeader>
                    {selectedImage && (
                        <div className="relative w-full h-full flex items-center justify-center overflow-auto rounded-xl bg-black/40 p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={selectedImage} 
                                alt="Order Proof" 
                                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl" 
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Rejection / Wrong Written Dialog */}
            <Dialog open={!!rejectOrderId} onOpenChange={(open) => !open && setRejectOrderId(null)}>
                <DialogContent className="max-w-md bg-neutral-900 border-white/10 p-6 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-primary font-sans font-bold tracking-wider text-xl mb-1 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Specify Rejection Remark
                        </DialogTitle>
                        <CardDescription className="text-foreground/50 text-xs">
                            This remark will be immediately visible to the customer and recorded on their order card.
                        </CardDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-3">
                        <div>
                            {savedReasons.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {savedReasons.map((reason, idx) => (
                                        <Badge 
                                            key={idx} 
                                            variant="outline" 
                                            className="cursor-pointer hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 text-[10px] font-normal transition-colors py-0.5 px-2 border-white/10"
                                            onClick={() => setRejectReason(reason)}
                                        >
                                            {reason}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <Input 
                                placeholder="e.g. Wrong review text submitted, please check required keywords" 
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="bg-white/5 border-white/15 text-foreground h-11 text-sm rounded-lg"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                className="flex-1 border-white/10" 
                                onClick={() => setRejectOrderId(null)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-sans tracking-wider uppercase text-xs h-10" 
                                disabled={!rejectReason.trim()}
                                onClick={() => rejectOrderId && updateOrderStatus(rejectOrderId, 'Refund Reject, Wrong Written', rejectReason)}
                            >
                                Submit Rejection
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

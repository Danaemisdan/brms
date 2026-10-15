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
    Filter
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl lg:text-4xl font-sans font-extrabold text-primary tracking-wider uppercase">
                            Order Intelligence
                        </h1>
                        <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-semibold rounded-full">
                            Live Sync
                        </span>
                    </div>
                    <p className="text-foreground/60 mt-2 font-sans tracking-wide text-sm max-w-2xl leading-relaxed">
                        Manual review, slot validation & automated email confirmation engine. Customers receive confirmation emails once verified.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Button 
                        variant="outline" 
                        className="bg-primary/10 text-primary border border-primary/40 hover:bg-primary/20 font-sans tracking-wider uppercase text-xs h-11 px-5 rounded-lg transition-all shadow-[0_0_20px_rgba(212,175,55,0.08)] flex items-center gap-2" 
                        onClick={() => window.open(`${API_URL}/api/orders/export?token=brms_export_secret_123`, "_blank")}
                    >
                        <Download className="w-4 h-4" />
                        Export Dossier
                    </Button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card 
                    className="p-4 glass-panel border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/40 transition-all"
                    onClick={() => setStatusFilter("Order Validating")}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Awaiting Verification</span>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-amber-400 mt-2">{validatingCount}</div>
                    <div className="text-[11px] text-foreground/50 mt-1">Ready for manual confirmation</div>
                </Card>

                <Card 
                    className="p-4 glass-panel border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent cursor-pointer hover:border-emerald-500/40 transition-all"
                    onClick={() => setStatusFilter("Order Confirmed (dating)")}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Order Confirmed</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-300 mt-2">{confirmedCount}</div>
                    <div className="text-[11px] text-foreground/50 mt-1">Verification emails sent</div>
                </Card>

                <Card 
                    className="p-4 glass-panel border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-transparent cursor-pointer hover:border-teal-500/40 transition-all"
                    onClick={() => setStatusFilter("Order Approved (After Submission of Review SS & Return Window SS)")}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Approved Proofs</span>
                        <Sparkles className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-teal-300 mt-2">{approvedCount}</div>
                    <div className="text-[11px] text-foreground/50 mt-1">Review & Return SS Verified</div>
                </Card>

                <Card 
                    className="p-4 glass-panel border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent cursor-pointer hover:border-purple-500/40 transition-all"
                    onClick={() => setStatusFilter("Refund Processing (15 days of Order Confirmation)")}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Refund Processing</span>
                        <Wallet className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-purple-300 mt-2">{refundProcessingCount}</div>
                    <div className="text-[11px] text-foreground/50 mt-1">Wallet credited / 15-day cycle</div>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <Card className="p-5 glass-panel border-white/5 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 relative w-full">
                        <Search className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                            placeholder="Search Order ID, mobile, email, customer, or product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 pl-10 bg-white/5 border-white/10 text-foreground placeholder:text-foreground/40 rounded-lg focus:border-primary/50 text-sm font-sans"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            className="h-11 rounded-lg border border-white/10 bg-black/60 px-3 text-foreground text-xs font-sans outline-none focus:border-primary/50 tracking-wider uppercase flex-1 md:w-[220px]"
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
                            className="h-11 rounded-lg border border-white/10 bg-black/60 px-3 text-foreground text-xs font-sans outline-none focus:border-primary/50 tracking-wider uppercase flex-1 md:w-[160px]"
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
                    <span className="text-foreground/40 text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
                        <Filter className="w-3 h-3" /> Quick Filter:
                    </span>
                    <button 
                        onClick={() => setStatusFilter("ALL")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === 'ALL' ? 'bg-primary text-black font-semibold' : 'bg-white/5 text-foreground/60 hover:bg-white/10'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setStatusFilter("Order Validating")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === 'Order Validating' ? 'bg-amber-500 text-black font-semibold' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                    >
                        Validating ({validatingCount})
                    </button>
                    <button 
                        onClick={() => setStatusFilter("Order Confirmed (dating)")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === 'Order Confirmed (dating)' ? 'bg-emerald-500 text-black font-semibold' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                    >
                        Confirmed ({confirmedCount})
                    </button>
                    <button 
                        onClick={() => setStatusFilter("Order Approved (After Submission of Review SS & Return Window SS)")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${statusFilter.includes('Approved') ? 'bg-teal-500 text-black font-semibold' : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'}`}
                    >
                        Approved ({approvedCount})
                    </button>
                    <button 
                        onClick={() => setStatusFilter("Refund Processing (15 days of Order Confirmation)")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${statusFilter.includes('Refund Processing') ? 'bg-purple-500 text-black font-semibold' : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'}`}
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
                                className="p-6 glass-panel border-white/10 hover:border-primary/30 transition-all rounded-xl shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
                            >
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <CardTitle className="text-lg font-sans font-bold text-primary tracking-wide">
                                            {order.product?.product_name || "Unknown Product"}
                                        </CardTitle>
                                        {getStatusBadge(order.status)}
                                        {order.product?.platform && (
                                            <span className="text-[11px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-foreground/70">
                                                {order.product.platform}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-foreground/60 font-sans">
                                        <span className="font-semibold text-foreground/90">
                                            Customer: {order.user?.name || "Guest"} ({order.user?.mobile})
                                        </span>
                                        {order.user?.email && (
                                            <span className="flex items-center gap-1 text-primary/80">
                                                <Mail className="w-3 h-3" /> {order.user.email}
                                            </span>
                                        )}
                                        {order.profile_name && (
                                            <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[11px]">
                                                Profile: {order.profile_name}
                                            </span>
                                        )}
                                        <span className="font-mono text-foreground/70">
                                            Order ID: <strong className="text-white">{order.order_id}</strong>
                                        </span>
                                        <span>
                                            Date: {new Date(order.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-emerald-400 font-semibold font-mono">
                                            Refund: ₹{order.product?.refund_amount || order.amount}
                                        </span>
                                    </div>

                                    {/* Remarks details */}
                                    {order.remarks && order.remarks !== order.status && (
                                        <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg max-w-xl">
                                            <strong>Remark:</strong> {order.remarks}
                                        </div>
                                    )}

                                    {/* Proof Image trigger */}
                                    {order.screenshot_url && order.screenshot_url !== "https://dummyimage.com/600x400/000/fff&text=Order+Screenshot" && (
                                        <button 
                                            onClick={() => setSelectedImage(order.screenshot_url)} 
                                            className="text-xs text-primary/90 hover:text-primary tracking-wider uppercase font-sans inline-flex items-center gap-1.5 border-b border-primary/30 hover:border-primary pt-1"
                                        >
                                            <ExternalLink className="w-3 h-3" /> View Submitted Proof Screenshot
                                        </button>
                                    )}
                                </div>

                                {/* Actions & Status Controllers */}
                                <div className="flex flex-col gap-3 min-w-[280px] lg:items-end border-t lg:border-t-0 pt-4 lg:pt-0 border-white/5">
                                    {/* Fast Action Buttons for Order Validating */}
                                    {isPendingValidation && (
                                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                                            <Button 
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide h-9 flex-1 shadow-md flex items-center justify-center gap-1.5"
                                                disabled={isUpdating === order.id}
                                                onClick={() => updateOrderStatus(order.id, 'Order Confirmed (dating)')}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Confirm & Email
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold text-xs tracking-wide h-9 flex items-center justify-center gap-1.5"
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
                                                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs tracking-wide h-9 shadow-md flex items-center justify-center gap-1.5"
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
                                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs tracking-wide h-9 shadow-md flex items-center justify-center gap-1.5"
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
                                        <label className="text-[10px] text-foreground/40 font-mono uppercase tracking-wider block">
                                            Update Status Remark:
                                        </label>
                                        <div className="relative">
                                            <select 
                                                className="h-9 w-full text-xs bg-black/80 border border-white/15 rounded-lg px-2.5 text-foreground appearance-none outline-none focus:border-primary pr-8"
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
                                            <ChevronDown className="w-3.5 h-3.5 text-foreground/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    });
                })()}
            </div>

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

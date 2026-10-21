"use client";

import { apiFetch } from "@/lib/apiFetch";
import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isDateMatch, DateFilterType } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
    ExternalLink, 
    CheckCircle2, 
    CreditCard, 
    XCircle, 
    Clock, 
    AlertTriangle, 
    Sparkles, 
    Wallet, 
    Search, 
    QrCode, 
    Copy, 
    Check, 
    ChevronLeft, 
    ChevronRight, 
    Maximize2, 
    Zap, 
    Filter,
    ShieldCheck
} from "lucide-react";

const API_URL = "";

// Helper to extract QR, UPI, or Bank Account details safely
function extractPaymentInfo(order: any) {
    const bank = order.user?.bank_details;
    const directUpi = order.user?.upi_id;
    const qrUrl = order.refund?.qr_code_url;

    let upiId: string | null = directUpi || null;
    let bankObj: { accountNumber?: string; ifsc?: string; name?: string; bankName?: string } | null = null;

    if (typeof bank === "string") {
        if (bank.includes("@")) {
            upiId = bank;
        } else {
            try {
                const parsed = JSON.parse(bank);
                if (typeof parsed === "object" && parsed !== null) {
                    upiId = parsed.upi_id || parsed.upiId || upiId;
                    bankObj = {
                        accountNumber: parsed.account_number || parsed.accountNumber,
                        ifsc: parsed.ifsc || parsed.ifsc_code,
                        name: parsed.name || parsed.account_holder || order.user?.name,
                        bankName: parsed.bank_name || parsed.bankName
                    };
                }
            } catch {
                if (!upiId) upiId = bank;
            }
        }
    } else if (typeof bank === "object" && bank !== null) {
        upiId = bank.upi_id || bank.upiId || upiId;
        bankObj = {
            accountNumber: bank.account_number || bank.accountNumber,
            ifsc: bank.ifsc || bank.ifsc_code,
            name: bank.name || bank.account_holder || order.user?.name,
            bankName: bank.bank_name || bank.bankName
        };
    }

    return { qrUrl, upiId, bankObj };
}

// Calculate days elapsed since order confirmation / refund creation
function getDaysElapsed(order: any): number {
    const baseline = order.refund?.created_at || order.delivery_date || order.order_date || order.created_at;
    const past = new Date(baseline).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - past) / (1000 * 60 * 60 * 24)));
}

export default function AdminRefunds() {
    const [refundRequests, setRefundRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState<DateFilterType>("ALL");
    const [maturityFilter, setMaturityFilter] = useState<"ALL" | "MATURED_10" | "MATURING">("ALL");

    // Speed Payout ("Dating Mode for Refunds") state
    const [isPayoutDeckOpen, setIsPayoutDeckOpen] = useState(false);
    const [payoutIndex, setPayoutIndex] = useState(0);
    const [payoutRejectReason, setPayoutRejectReason] = useState("");
    const [isRejectingInDeck, setIsRejectingInDeck] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Filter queue specifically for Payout Deck: pending payout, sorted by matured first
    const payoutQueue = refundRequests
        .filter(r => r.refund?.status !== 'REFUNDED' && r.status !== 'Refund Reject, Wrong Written' && r.refund?.status !== 'FAILED')
        .sort((a, b) => getDaysElapsed(b) - getDaysElapsed(a));

    useEffect(() => {
        fetchRefunds();
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("mode") === "dating" || params.get("mode") === "payout") {
                setIsPayoutDeckOpen(true);
            }
        }
    }, []);

    // Ensure payout index stays valid
    useEffect(() => {
        if (payoutQueue.length > 0 && payoutIndex >= payoutQueue.length) {
            setPayoutIndex(Math.max(0, payoutQueue.length - 1));
        }
    }, [payoutQueue.length, payoutIndex]);

    // Keyboard shortcuts for Speed Payout Deck
    useEffect(() => {
        if (!isPayoutDeckOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            if (e.key === 'Escape') {
                if (isRejectingInDeck) {
                    setIsRejectingInDeck(false);
                } else {
                    setIsPayoutDeckOpen(false);
                }
                return;
            }

            if (isTyping) {
                if (e.key === 'Enter' && isRejectingInDeck) {
                    e.preventDefault();
                    const current = payoutQueue[payoutIndex];
                    if (current && payoutRejectReason.trim()) {
                        handlePayoutReject(current.id);
                    }
                }
                return;
            }

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                setPayoutIndex(prev => Math.min(prev + 1, Math.max(0, payoutQueue.length - 1)));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setPayoutIndex(prev => Math.max(0, prev - 1));
            } else if (e.key === 'p' || e.key === 'P' || e.key === 'Enter') {
                e.preventDefault();
                const current = payoutQueue[payoutIndex];
                if (current && isUpdating !== current.id) {
                    handlePayoutMarkPaid(current.id);
                }
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                setPayoutRejectReason("Refund Reject, Wrong Written");
                setIsRejectingInDeck(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPayoutDeckOpen, payoutIndex, payoutQueue, isUpdating, isRejectingInDeck, payoutRejectReason]);

    const fetchRefunds = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const ordersRes = await apiFetch(`${API_URL}/api/orders`, { headers });

            if (ordersRes.ok) {
                const data = await ordersRes.json();
                // Include orders with refund record, or in refund processing / approved status
                const refunds = (data.orders || []).filter((o: any) => 
                    o.refund != null || 
                    o.status?.includes("Refund Processing") || 
                    o.status?.includes("Order Approved") ||
                    o.status === "Refund Reject, Wrong Written"
                );
                setRefundRequests(refunds);
            }
        } catch (error) {
            console.error("Failed to fetch refunds:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayoutMarkPaid = async (orderId: string) => {
        setIsUpdating(orderId);
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/orders/${orderId}/refund/status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: "REFUNDED" })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to update refund.");
            }

            toast.success("Refund marked as paid & sent! Notification dispatched to customer.");
            setIsRejectingInDeck(false);
            setPayoutRejectReason("");
            await fetchRefunds();
        } catch (error: any) {
            toast.error(error.message || "Failed to mark refund as paid");
        } finally {
            setIsUpdating(null);
        }
    };

    const handlePayoutReject = async (orderId: string) => {
        if (!payoutRejectReason.trim()) {
            toast.error("Please enter a rejection reason");
            return;
        }

        setIsUpdating(orderId);
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/orders/${orderId}/refund/status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    status: "FAILED", 
                    reason: payoutRejectReason.trim(),
                    remarks: payoutRejectReason.trim()
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to reject refund.");
            }

            toast.success(`Refund marked as not sent: "${payoutRejectReason.trim()}"`);
            setIsRejectingInDeck(false);
            setPayoutRejectReason("");
            await fetchRefunds();
        } catch (error: any) {
            toast.error(error.message || "Failed to reject refund");
        } finally {
            setIsUpdating(null);
        }
    };

    const copyToClipboard = (text: string, fieldId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Metrics calculations
    const maturedCount = refundRequests.filter(r => 
        getDaysElapsed(r) >= 10 && 
        r.refund?.status !== 'REFUNDED' && 
        r.status !== 'Refund Reject, Wrong Written' &&
        r.refund?.status !== 'FAILED'
    ).length;

    const maturingCount = refundRequests.filter(r => 
        getDaysElapsed(r) < 10 && 
        r.refund?.status !== 'REFUNDED' && 
        r.status !== 'Refund Reject, Wrong Written' &&
        r.refund?.status !== 'FAILED'
    ).length;

    const totalPaidAmount = refundRequests
        .filter(r => r.refund?.status === "REFUNDED")
        .reduce((sum, r) => sum + (r.refund?.amount || r.product?.refund_amount || r.amount || 0), 0);

    const paidCount = refundRequests.filter(r => r.refund?.status === "REFUNDED").length;
    const failedCount = refundRequests.filter(r => r.refund?.status === "FAILED" || r.status === "Refund Reject, Wrong Written").length;

    return (
        <div className="space-y-8 relative z-10 pb-16">
            {/* Header section with refined dark luxury aesthetic */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                            Refund Operations
                        </h1>
                        <span className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-semibold rounded-full">
                            10–15d Payout Engine
                        </span>
                    </div>
                    <p className="text-muted-foreground mt-1.5 font-sans tracking-wide text-xs sm:text-sm max-w-2xl leading-relaxed">
                        10–15 day maturity verification, UPI QR direct camera scanning & 1-click settlement lifecycle.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Button 
                        onClick={() => { setPayoutIndex(0); setIsPayoutDeckOpen(true); }}
                        className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs tracking-wider uppercase h-11 px-5 rounded-xl transition-all shadow-sm border border-zinc-800 dark:border-zinc-200 flex items-center gap-2 group"
                    >
                        <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 group-hover:scale-110 transition-transform" />
                        Speed Payout Deck ({payoutQueue.length})
                    </Button>
                </div>
            </div>

            {/* Maturity Attention Banner */}
            {maturedCount > 0 && (
                <div className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-emerald-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-emerald-500 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground text-sm tracking-tight flex items-center gap-2">
                                {maturedCount} Refund{maturedCount > 1 ? "s" : ""} Eligible for Immediate Payout (10+ Days Matured)
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-mono">
                                    Ready to Pay
                                </Badge>
                            </h3>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                These customer orders have passed the 10–15 day maturity window. Launch the Speed Payout Deck to scan UPI QR codes directly with your phone.
                            </p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => { setPayoutIndex(0); setIsPayoutDeckOpen(true); }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wider uppercase h-10 px-5 rounded-xl shrink-0 shadow-sm flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Pay Matured Queue
                    </Button>
                </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card 
                    className="p-4 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 cursor-pointer hover:border-emerald-500/40 transition-all rounded-2xl shadow-xs"
                    onClick={() => { setMaturityFilter("MATURED_10"); setStatusFilter("ALL"); }}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Eligible (10+ Days)</span>
                        <Zap className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground mt-2">{maturedCount}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Ready for phone QR scan / payout</div>
                </Card>

                <Card 
                    className="p-4 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 cursor-pointer hover:border-amber-500/40 transition-all rounded-2xl shadow-xs"
                    onClick={() => { setMaturityFilter("MATURING"); setStatusFilter("ALL"); }}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Maturing (&lt; 10 Days)</span>
                        <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground mt-2">{maturingCount}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Under review / 15-day cycle</div>
                </Card>

                <Card 
                    className="p-4 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 cursor-pointer hover:border-teal-500/40 transition-all rounded-2xl shadow-xs"
                    onClick={() => { setStatusFilter("REFUNDED"); setMaturityFilter("ALL"); }}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Paid Out ({paidCount})</span>
                        <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground mt-2">₹{totalPaidAmount.toLocaleString()}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Completed settlements</div>
                </Card>

                <Card 
                    className="p-4 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 cursor-pointer hover:border-zinc-400 transition-all rounded-2xl shadow-xs"
                    onClick={() => { setStatusFilter("FAILED"); setMaturityFilter("ALL"); }}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Rejected / Failed</span>
                        <XCircle className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground mt-2">{failedCount}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Wrong written / invalid payment</div>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <Card className="p-5 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 relative w-full">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                            placeholder="Search customer, mobile, Order ID, UPI ID, or product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 pl-10 bg-background/50 border-zinc-200 dark:border-zinc-800 text-foreground placeholder:text-muted-foreground rounded-xl focus:border-zinc-400 text-sm font-sans"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            className="h-11 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background/80 px-3 text-foreground text-xs font-sans outline-none focus:border-zinc-400 tracking-wider uppercase flex-1 md:w-[200px]"
                            value={maturityFilter}
                            onChange={(e) => setMaturityFilter(e.target.value as any)}
                        >
                            <option value="ALL">All Maturity ({refundRequests.length})</option>
                            <option value="MATURED_10">10+ Days Matured ({maturedCount})</option>
                            <option value="MATURING">Maturing (&lt; 10 Days) ({maturingCount})</option>
                        </select>
                        <select
                            className="h-11 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background/80 px-3 text-foreground text-xs font-sans outline-none focus:border-zinc-400 tracking-wider uppercase flex-1 md:w-[180px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending Payout</option>
                            <option value="PROCESSING">Refund Processing (15d)</option>
                            <option value="REFUNDED">Paid & Complete</option>
                            <option value="FAILED">Rejected / Not Sent</option>
                        </select>
                        <select
                            className="h-11 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background/80 px-3 text-foreground text-xs font-sans outline-none focus:border-zinc-400 tracking-wider uppercase flex-1 md:w-[150px]"
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

                {/* Quick filter pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    <span className="text-muted-foreground text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
                        <Filter className="w-3 h-3" /> Quick Filter:
                    </span>
                    <button 
                        onClick={() => { setStatusFilter("ALL"); setMaturityFilter("ALL"); }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === 'ALL' && maturityFilter === 'ALL' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
                    >
                        All ({refundRequests.length})
                    </button>
                    <button 
                        onClick={() => { setMaturityFilter("MATURED_10"); setStatusFilter("ALL"); }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${maturityFilter === 'MATURED_10' ? 'bg-emerald-600 text-white font-semibold' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'}`}
                    >
                        <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                        10+ Days Matured ({maturedCount})
                    </button>
                    <button 
                        onClick={() => { setStatusFilter("PENDING"); setMaturityFilter("ALL"); }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === 'PENDING' ? 'bg-amber-500 text-white font-semibold' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'}`}
                    >
                        Pending Payout
                    </button>
                    <button 
                        onClick={() => { setStatusFilter("REFUNDED"); setMaturityFilter("ALL"); }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === 'REFUNDED' ? 'bg-teal-600 text-white font-semibold' : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20'}`}
                    >
                        Paid ({paidCount})
                    </button>
                    <button 
                        onClick={() => { setStatusFilter("FAILED"); setMaturityFilter("ALL"); }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === 'FAILED' ? 'bg-zinc-800 text-white font-semibold' : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}
                    >
                        Rejected ({failedCount})
                    </button>
                </div>
            </Card>

            {/* Refund Table View */}
            <div className="space-y-4">
                {isLoading ? (
                    <Card className="p-16 text-center bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                        <Clock className="w-8 h-8 text-foreground/40 mx-auto animate-spin mb-3" />
                        <p className="text-muted-foreground font-sans tracking-widest text-xs uppercase">Loading refund records...</p>
                    </Card>
                ) : (() => {
                    const filteredRefunds = refundRequests.filter(req => {
                        const searchStr = searchTerm.toLowerCase();
                        const { upiId } = extractPaymentInfo(req);
                        const matchesSearch =
                            (req.user?.name || "").toLowerCase().includes(searchStr) ||
                            (req.user?.mobile || "").includes(searchStr) ||
                            (req.product?.product_name || "").toLowerCase().includes(searchStr) ||
                            (req.order_id || "").toLowerCase().includes(searchStr) ||
                            (upiId || "").toLowerCase().includes(searchStr);

                        const rStatus = req.refund?.status || "PENDING";
                        const filterMatchStatus = rStatus === "VERIFIED" ? "APPROVED" : rStatus;
                        const matchesStatus = 
                            statusFilter === "ALL" || 
                            filterMatchStatus === statusFilter ||
                            (statusFilter === "FAILED" && (req.status === "Refund Reject, Wrong Written" || rStatus === "FAILED")) ||
                            (statusFilter === "PENDING" && (rStatus === "PENDING" || rStatus === "PROCESSING" || req.status?.includes("Refund Processing")));

                        const daysElapsed = getDaysElapsed(req);
                        const matchesMaturity = 
                            maturityFilter === "ALL" ||
                            (maturityFilter === "MATURED_10" && daysElapsed >= 10) ||
                            (maturityFilter === "MATURING" && daysElapsed < 10);

                        const matchesDate = isDateMatch(req.refund?.created_at || req.created_at, dateFilter);

                        return matchesSearch && matchesStatus && matchesMaturity && matchesDate;
                    });

                    if (filteredRefunds.length === 0) {
                        return (
                            <Card className="p-16 text-center bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                                <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                                    <Search className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground">No refund requests found</h3>
                                <p className="text-muted-foreground font-sans text-xs mt-1">Try adjusting your search criteria, maturity, or status filter.</p>
                            </Card>
                        );
                    }

                    return (
                        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/40 border-b border-zinc-200/80 dark:border-zinc-800/80">
                                        <TableRow className="border-zinc-200/80 dark:border-zinc-800/80 hover:bg-transparent">
                                            <TableHead className="w-[180px] font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                                            <TableHead className="w-[200px] font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
                                            <TableHead className="text-right font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground">Refund (₹)</TableHead>
                                            <TableHead className="font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground">Maturity Window</TableHead>
                                            <TableHead className="font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground">Payment Details</TableHead>
                                            <TableHead className="font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground">Order ID</TableHead>
                                            <TableHead className="font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                            <TableHead className="text-right font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRefunds.map((req) => {
                                             const { qrUrl, upiId, bankObj } = extractPaymentInfo(req);
                                            const daysElapsed = getDaysElapsed(req);
                                            const isMatured = daysElapsed >= 10;
                                            const isPaid = req.refund?.status === "REFUNDED";
                                            const isRejected = req.refund?.status === "FAILED" || req.status === "Refund Reject, Wrong Written";

                                            return (
                                                <TableRow key={req.id} className="hover:bg-muted/30 border-zinc-200/60 dark:border-zinc-800/60 transition-colors">
                                                    <TableCell>
                                                        <div className="font-medium text-foreground text-sm">{req.user?.name || "Customer"}</div>
                                                        <div className="text-xs font-mono text-muted-foreground">{req.user?.mobile}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="line-clamp-2 text-xs text-foreground/80 font-medium" title={req.product?.product_name}>
                                                            {req.product?.product_name || "Unknown Product"}
                                                        </div>
                                                        {req.product?.platform && (
                                                            <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                                                {req.product.platform}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                                        ₹{req.refund?.amount || req.product?.refund_amount || req.amount}
                                                    </TableCell>
                                                    <TableCell>
                                                        {daysElapsed >= 15 ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                                                                <Zap className="w-3 h-3 fill-emerald-500" /> 15+ Days (Matured)
                                                            </span>
                                                        ) : daysElapsed >= 10 ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                                <CheckCircle2 className="w-3 h-3" /> {daysElapsed}d (Eligible)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                                <Clock className="w-3 h-3" /> {daysElapsed}d ({10 - daysElapsed}d left)
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {qrUrl ? (
                                                            <button 
                                                                onClick={() => setSelectedImage(qrUrl)}
                                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-lg transition-colors"
                                                            >
                                                                <QrCode className="w-3.5 h-3.5" /> Scan QR Code
                                                            </button>
                                                        ) : upiId ? (
                                                            <div className="flex items-center gap-1.5 font-mono text-xs text-foreground bg-muted/40 border border-border px-2 py-1 rounded-lg max-w-[180px] truncate">
                                                                <span className="truncate">{upiId}</span>
                                                                <button 
                                                                    onClick={() => copyToClipboard(upiId, req.id)}
                                                                    className="text-muted-foreground hover:text-foreground shrink-0"
                                                                >
                                                                    {copiedField === req.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                                </button>
                                                            </div>
                                                        ) : bankObj?.accountNumber ? (
                                                            <div className="text-[11px] font-mono text-muted-foreground bg-muted/40 p-1.5 rounded-lg border border-border">
                                                                A/C: {bankObj.accountNumber} ({bankObj.ifsc})
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">No details submitted</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-mono text-xs text-muted-foreground">{req.order_id}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {isPaid ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                                                <CheckCircle2 className="w-3 h-3" /> REFUNDED
                                                            </span>
                                                        ) : isRejected ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
                                                                <XCircle className="w-3 h-3" /> NOT SENT
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                                                <Clock className="w-3 h-3" /> {req.refund?.status || "PENDING"}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {!isPaid && !isRejected && (
                                                                <>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline" 
                                                                        className="h-8 text-xs font-medium border-zinc-300 dark:border-zinc-700 text-muted-foreground hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 rounded-lg" 
                                                                        disabled={isUpdating === req.id}
                                                                        onClick={() => {
                                                                            setPayoutRejectReason("Refund Reject, Wrong Written");
                                                                            handlePayoutReject(req.id);
                                                                        }}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="h-8 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs flex items-center gap-1" 
                                                                        disabled={isUpdating === req.id}
                                                                        onClick={() => handlePayoutMarkPaid(req.id)}
                                                                    >
                                                                        <CheckCircle2 className="w-3 h-3" /> Mark Paid
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {isPaid && (
                                                                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                                                    Paid {req.refund?.processed_date ? new Date(req.refund.processed_date).toLocaleDateString() : ""}
                                                                </span>
                                                            )}
                                                            {isRejected && (
                                                                <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[140px]" title={req.remarks || "Rejected"}>
                                                                    {req.remarks || "Not Sent"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* SPEED PAYOUT DECK ("DATING MODE FOR REFUNDS") FULLSCREEN DIALOG */}
            <Dialog open={isPayoutDeckOpen} onOpenChange={setIsPayoutDeckOpen}>
                <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] flex flex-col bg-zinc-950/98 border border-zinc-800 p-0 rounded-3xl shadow-2xl overflow-hidden text-zinc-100">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Zap className="w-4 h-4 fill-emerald-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-sans font-bold text-white tracking-tight flex items-center gap-2">
                                    Speed Payout Deck
                                    {payoutQueue.length > 0 && (
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                                            Card {payoutIndex + 1} of {payoutQueue.length}
                                        </Badge>
                                    )}
                                </DialogTitle>
                                <p className="text-[11px] text-zinc-400">
                                    Point Phone Camera to Scan UPI QR Code & Mark Paid Instantly
                                </p>
                            </div>
                        </div>

                        {payoutQueue.length > 0 && (
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-mono text-zinc-400">
                                        {Math.round(((payoutIndex + 1) / payoutQueue.length) * 100)}% Settled
                                    </span>
                                    <div className="w-32 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-emerald-500 h-full transition-all duration-300"
                                            style={{ width: `${((payoutIndex + 1) / payoutQueue.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Body */}
                    {payoutQueue.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center space-y-4 my-auto">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold font-sans text-white">All Eligible Payouts Completed!</h3>
                            <p className="text-zinc-400 text-sm max-w-md">
                                The payout queue is completely clear. All matured refund claims have been settled or reviewed.
                            </p>
                            <Button 
                                className="bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-xs tracking-wider uppercase h-10 px-6 rounded-xl mt-2"
                                onClick={() => setIsPayoutDeckOpen(false)}
                            >
                                Return to Refunds Table
                            </Button>
                        </div>
                    ) : (() => {
                        const currentOrder = payoutQueue[payoutIndex] || payoutQueue[0];
                        const { qrUrl, upiId, bankObj } = extractPaymentInfo(currentOrder);
                        const daysElapsed = getDaysElapsed(currentOrder);
                        const isMatured = daysElapsed >= 10;
                        const refundAmount = currentOrder.refund?.amount || currentOrder.product?.refund_amount || currentOrder.amount;

                        return (
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[60vh]">
                                    {/* Left Column: QR Code & Payment Destination (Front & Center) */}
                                    <div className="space-y-4 flex flex-col items-center justify-center bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 text-center">
                                        {/* Large Scan Target */}
                                        {qrUrl ? (
                                            <div className="space-y-3 flex flex-col items-center">
                                                <div className="relative group p-3 bg-white rounded-2xl shadow-xl border-2 border-emerald-500/40">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img 
                                                        src={qrUrl} 
                                                        alt="UPI QR Code" 
                                                        className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                                                        onClick={() => setSelectedImage(qrUrl)}
                                                    />
                                                    <button 
                                                        onClick={() => setSelectedImage(qrUrl)}
                                                        className="absolute top-4 right-4 bg-zinc-950/80 hover:bg-zinc-950 text-white p-2 rounded-lg border border-white/20 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Zoom Full Size"
                                                    >
                                                        <Maximize2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-sans font-semibold">
                                                    <QrCode className="w-4 h-4" />
                                                    <span>Point Phone (GPay / PhonePe / Paytm) to Scan</span>
                                                </div>
                                            </div>
                                        ) : upiId ? (
                                            <div className="space-y-4 w-full py-8">
                                                <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-300">
                                                    <QrCode className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Customer UPI ID</span>
                                                    <div className="flex items-center justify-center gap-2 mt-2">
                                                        <span className="font-mono text-lg font-bold text-white bg-zinc-800/80 border border-zinc-700 px-4 py-2 rounded-xl">
                                                            {upiId}
                                                        </span>
                                                        <Button 
                                                            size="sm"
                                                            className="h-10 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-mono text-xs flex items-center gap-1.5 rounded-xl"
                                                            onClick={() => copyToClipboard(upiId, 'deck-upi')}
                                                        >
                                                            {copiedField === 'deck-upi' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                            Copy
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : bankObj?.accountNumber ? (
                                            <div className="space-y-3 w-full text-left py-4">
                                                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block text-center">Bank Account Transfer</span>
                                                <div className="space-y-2 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 text-xs font-mono">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-zinc-400">A/C Number:</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <strong className="text-white">{bankObj.accountNumber}</strong>
                                                            <button onClick={() => copyToClipboard(bankObj.accountNumber!, 'ac')} className="text-zinc-400 hover:text-white">
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-zinc-400">IFSC Code:</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <strong className="text-white">{bankObj.ifsc}</strong>
                                                            <button onClick={() => copyToClipboard(bankObj.ifsc!, 'ifsc')} className="text-zinc-400 hover:text-white">
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {bankObj.name && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-zinc-400">Beneficiary:</span>
                                                            <span className="text-white">{bankObj.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center text-zinc-500 space-y-2">
                                                <AlertTriangle className="w-10 h-10 text-amber-500/60 mx-auto" />
                                                <p className="text-xs">No UPI QR Code or Bank Account submitted yet.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column: Amount, Maturity Badge & Customer Details */}
                                    <div className="space-y-4">
                                        {/* Maturity Badge */}
                                        <div className="flex items-center justify-between">
                                            {daysElapsed >= 15 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                                    <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" /> 15+ Days Fully Matured (Immediate Payout)
                                                </span>
                                            ) : daysElapsed >= 10 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> {daysElapsed} Days Elapsed (Eligible for Payout)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    <Clock className="w-3.5 h-3.5" /> Maturing: {daysElapsed} Days ({10 - daysElapsed}d to 10-day mark)
                                                </span>
                                            )}
                                            <span className="text-[11px] font-mono text-zinc-500">
                                                Order #{currentOrder.order_id}
                                            </span>
                                        </div>

                                        {/* Giant Refund Amount Display */}
                                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                                            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest block font-semibold">
                                                Payout Settlement Amount
                                            </span>
                                            <div className="text-4xl sm:text-5xl font-mono font-extrabold text-emerald-400 tracking-tight mt-1">
                                                ₹{refundAmount?.toLocaleString()}
                                            </div>
                                        </div>

                                        {/* Product & Order Details */}
                                        <div className="space-y-2 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs">
                                            <div className="flex items-center gap-2 mb-1">
                                                {currentOrder.product?.platform && (
                                                    <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px] font-mono uppercase">
                                                        {currentOrder.product.platform}
                                                    </Badge>
                                                )}
                                                <span className="font-bold text-white truncate">{currentOrder.product?.product_name}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-zinc-400">
                                                <span>Customer:</span>
                                                <strong className="text-white font-medium">{currentOrder.user?.name || "Customer"}</strong>
                                            </div>
                                            <div className="flex justify-between items-center text-zinc-400">
                                                <span>Mobile:</span>
                                                <span className="font-mono text-white">{currentOrder.user?.mobile}</span>
                                            </div>
                                            {currentOrder.user?.email && (
                                                <div className="flex justify-between items-center text-zinc-400">
                                                    <span>Email:</span>
                                                    <span className="font-mono text-zinc-300 text-[11px]">{currentOrder.user.email}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center text-zinc-400">
                                                <span>Confirmed On:</span>
                                                <span className="font-mono text-zinc-400">{new Date(currentOrder.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Review Proof Preview (if present) */}
                                        {currentOrder.review?.screenshot_url && (
                                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs">
                                                <span className="text-zinc-400 flex items-center gap-1.5">
                                                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Review Proof
                                                </span>
                                                <button 
                                                    onClick={() => setSelectedImage(currentOrder.review.screenshot_url)}
                                                    className="text-zinc-300 hover:text-white font-mono flex items-center gap-1 text-[11px] underline"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> View Screenshot
                                                </button>
                                            </div>
                                        )}

                                        {currentOrder.remarks && currentOrder.remarks !== currentOrder.status && (
                                            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                                                <strong>Order Remark:</strong> {currentOrder.remarks}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Action Area */}
                                {isRejectingInDeck ? (
                                    <div className="p-4 bg-zinc-900 border-t border-zinc-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <AlertTriangle className="w-4 h-4 text-amber-400" /> Specify Why Payment Was Not Sent (Visible to Customer)
                                            </span>
                                            <button 
                                                onClick={() => setIsRejectingInDeck(false)} 
                                                className="text-zinc-400 hover:text-white text-xs"
                                            >
                                                Cancel [Esc]
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                "Refund Reject, Wrong Written", 
                                                "Invalid UPI ID / QR not scanning", 
                                                "Bank account details invalid", 
                                                "Review not verified / Fake review", 
                                                "Return window active on platform"
                                            ].map((preset, idx) => (
                                                <Badge 
                                                    key={idx} 
                                                    variant="outline" 
                                                    className="cursor-pointer hover:bg-white/10 hover:text-white text-[11px] py-1 px-2.5 border-zinc-700 text-zinc-300 rounded-lg"
                                                    onClick={() => setPayoutRejectReason(preset)}
                                                >
                                                    {preset}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input 
                                                autoFocus
                                                placeholder="Type rejection remark visible to customer... (Press Enter to submit)"
                                                value={payoutRejectReason}
                                                onChange={(e) => setPayoutRejectReason(e.target.value)}
                                                className="bg-zinc-800/80 border-zinc-700 text-white h-11 text-xs rounded-xl flex-1 placeholder:text-zinc-500"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && payoutRejectReason.trim()) {
                                                        e.preventDefault();
                                                        handlePayoutReject(currentOrder.id);
                                                    }
                                                }}
                                            />
                                            <Button 
                                                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs h-11 px-5 rounded-xl uppercase tracking-wider"
                                                disabled={!payoutRejectReason.trim() || isUpdating === currentOrder.id}
                                                onClick={() => handlePayoutReject(currentOrder.id)}
                                            >
                                                Submit Rejection
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            disabled={payoutIndex === 0}
                                            onClick={() => setPayoutIndex(prev => Math.max(0, prev - 1))}
                                            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 h-11 px-4 rounded-xl flex items-center gap-1.5 text-xs font-mono w-full sm:w-auto justify-center"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Previous
                                        </Button>

                                        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 justify-center max-w-xl">
                                            {/* MARK AS PAID */}
                                            <Button 
                                                disabled={isUpdating === currentOrder.id}
                                                onClick={() => handlePayoutMarkPaid(currentOrder.id)}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wide h-12 rounded-xl shadow-xs flex flex-col items-center justify-center transition-all group"
                                            >
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>Mark Paid & Sent (REFUNDED)</span>
                                                    <kbd className="text-[10px] font-mono bg-emerald-700/60 px-1.5 py-0.5 rounded ml-1">P</kbd>
                                                </div>
                                                <span className="text-[10px] text-emerald-100/70 font-normal">Records timestamp & notifies customer</span>
                                            </Button>

                                            {/* NOT SENT / REJECT */}
                                            <Button 
                                                variant="outline"
                                                disabled={isUpdating === currentOrder.id}
                                                onClick={() => {
                                                    setPayoutRejectReason("Refund Reject, Wrong Written");
                                                    setIsRejectingInDeck(true);
                                                }}
                                                className="border-zinc-700 text-zinc-300 hover:text-rose-400 hover:bg-rose-500/10 font-semibold text-xs tracking-wide h-12 px-5 rounded-xl flex flex-col items-center justify-center transition-all"
                                            >
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <XCircle className="w-3.5 h-3.5 text-zinc-400" />
                                                    <span>Not Sent / Reject</span>
                                                    <kbd className="text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded ml-1">R</kbd>
                                                </div>
                                                <span className="text-[10px] text-zinc-400 font-normal">Type custom reason</span>
                                            </Button>
                                        </div>

                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            disabled={payoutIndex >= payoutQueue.length - 1}
                                            onClick={() => setPayoutIndex(prev => Math.min(prev + 1, payoutQueue.length - 1))}
                                            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 h-11 px-4 rounded-xl flex items-center gap-1.5 text-xs font-mono w-full sm:w-auto justify-center"
                                        >
                                            Next <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}

                                {/* Footer Shortcut Legend */}
                                <div className="bg-zinc-950 px-4 py-2.5 border-t border-zinc-800 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-zinc-400">
                                    <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-white font-bold">P / Enter</kbd> Mark Paid & Sent</span>
                                    <span>•</span>
                                    <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-white font-bold">R</kbd> Reject / Not Sent</span>
                                    <span>•</span>
                                    <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-white font-bold">←</kbd> <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-white font-bold">→</kbd> Navigate</span>
                                    <span>•</span>
                                    <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-white font-bold">Esc</kbd> Close</span>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Lightbox Dialog for QR Code & Proof Images */}
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col items-center justify-center bg-zinc-950/98 border-zinc-800 p-6 rounded-3xl">
                    <DialogHeader className="w-full mb-3 flex flex-row items-center justify-between">
                        <DialogTitle className="text-white font-mono text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Preview Image / QR Code
                        </DialogTitle>
                    </DialogHeader>
                    {selectedImage && (
                        <div className="relative w-full h-full flex items-center justify-center overflow-auto rounded-2xl bg-white p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={selectedImage} 
                                alt="Preview" 
                                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl" 
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

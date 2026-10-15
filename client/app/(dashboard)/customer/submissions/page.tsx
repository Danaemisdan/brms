"use client";

import { apiFetch } from "@/lib/apiFetch";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardTitle, CardDescription, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { isDateMatch, DateFilterType } from "@/lib/dateUtils";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";
import { 
    Clock, 
    CheckCircle2, 
    AlertTriangle, 
    XCircle, 
    Sparkles, 
    Wallet, 
    ArrowUpRight, 
    CreditCard, 
    Info, 
    UploadCloud,
    HelpCircle,
    RefreshCw
} from "lucide-react";

const API_URL = "";

function CustomerSubmissionsContent() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Filtering State
    const [searchTermFilter, setSearchTermFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState<DateFilterType>("ALL");

    // Active products for selection
    const [products, setProducts] = useState<any[]>([]);

    // Modals
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [reviewScreenshot, setReviewScreenshot] = useState("");
    const [returnWindowScreenshot, setReturnWindowScreenshot] = useState("");
    const [managerName, setManagerName] = useState("");

    // UPI Withdrawal Modal
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawUpi, setWithdrawUpi] = useState("");
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // Add New Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [orderForm, setOrderForm] = useState<{productId: string, orderId: string, amount: string, profileName?: string, referenceName?: string, screenshot: string}>({ productId: "", orderId: "", amount: "", profileName: "", referenceName: "", screenshot: "" });
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
    const [retryForm, setRetryForm] = useState({ orderId: "", amount: "", screenshot: "" });

    const searchParams = useSearchParams();
    const autoSubmitId = searchParams.get("submit");

    useEffect(() => {
        fetchMyOrders();
        fetchActiveProducts();
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await apiFetch(`${API_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserProfile(data.user);
                if (data.user?.upi_id) {
                    setWithdrawUpi(data.user.upi_id);
                }
            }
        } catch (error) {
            console.error("Failed to load user profile");
        }
    };

    useEffect(() => {
        if (!autoSubmitId) return;

        const matched = products.find(p => p.id === autoSubmitId);
        if (matched) {
            setOrderForm(prev => ({ ...prev, productId: matched.id }));
            setIsAddModalOpen(true);
        } else if (products.length > 0) {
            const fetchExclusive = async () => {
                try {
                    const res = await apiFetch(`${API_URL}/api/products/${autoSubmitId}/campaign`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.product) {
                            setProducts(prev => {
                                if (prev.some(p => p.id === data.product.id)) return prev;
                                return [...prev, data.product];
                            });
                            setOrderForm(prev => ({ ...prev, productId: data.product.id }));
                            setIsAddModalOpen(true);
                        }
                    }
                } catch (e) { console.error(e); }
            };
            fetchExclusive();
        }
    }, [autoSubmitId, products]);

    const fetchActiveProducts = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error("Failed to load active products", error);
        }
    };

    const fetchMyOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/orders/my-orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error("Failed to fetch orders.");
        } finally {
            setIsLoading(false);
        }
    };

    const openRefundModal = (order: any) => {
        setActiveOrder(order);
        setIsRefundModalOpen(true);
        setReviewScreenshot("");
        setReturnWindowScreenshot("");
    };

    const openRetryModal = (order: any) => {
        setActiveOrder(order);
        setRetryForm({
            orderId: order.order_id || "",
            amount: order.refundAmount?.toString() || "",
            screenshot: order.screenshot_url || ""
        });
        setSubmitError("");
        setIsRetryModalOpen(true);
    };

    const handleWithdrawUpi = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(withdrawAmount);
        if (!amt || amt <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }
        if (!withdrawUpi.trim()) {
            toast.error("Please provide a valid UPI ID (e.g. mobile@upi).");
            return;
        }
        if (amt > (userProfile?.wallet_balance || 0)) {
            toast.error("Withdrawal amount cannot exceed your wallet balance.");
            return;
        }

        setIsWithdrawing(true);
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/v1/wallet/redeem-upi`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ amount: amt, upi_id: withdrawUpi.trim() })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || `₹${amt} transferred to your UPI successfully!`);
                setIsWithdrawModalOpen(false);
                setWithdrawAmount("");
                await fetchUserProfile();
            } else {
                toast.error(data.error || "Withdrawal failed. Please check details.");
            }
        } catch (err) {
            toast.error("Error processing UPI withdrawal.");
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleApplyRefundSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewScreenshot) {
            toast.error("Please upload a screenshot of your review.");
            return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token") || "";
            const payload = JSON.parse(atob(token.split('.')[1]));
            const defaultUpiId = userProfile?.upi_id || userProfile?.encrypted_bank_data || "Default Account";

            const res = await apiFetch(`${API_URL}/api/orders/${activeOrder.id}/refund`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    review_url: "",
                    review_screenshot: reviewScreenshot,
                    return_window_screenshot: returnWindowScreenshot,
                    upi_id: defaultUpiId,
                    qr_code_url: "",
                    mobile: payload.mobile || "",
                    manager_name: managerName
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }

            toast.success("Proofs submitted! Our admin team is verifying your Review SS & Return Window SS.");
            setIsRefundModalOpen(false);
            setActiveOrder(null);
            setReviewScreenshot("");
            setReturnWindowScreenshot("");
            setManagerName("");
            fetchMyOrders();
        } catch (error: any) {
            toast.error(error.message || "Failed to submit refund claim.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");
        if (!orderForm.screenshot) {
            setSubmitError("Please upload an order screenshot.");
            return;
        }
        if (!orderForm.productId) {
            setSubmitError("Please select the product you ordered.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                product_id: orderForm.productId,
                order_id: orderForm.orderId,
                amount: orderForm.amount,
                screenshot_url: orderForm.screenshot,
                profile_name: orderForm.profileName,
                reference_name: orderForm.referenceName
            };

            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/orders/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Submission failed");
            }

            toast.success("Order Submitted! It is now in 'Order Validating'. You will receive an email once verified.");
            setIsAddModalOpen(false);
            setOrderForm({ productId: "", orderId: "", amount: "", profileName: "", referenceName: "", screenshot: "" });
            fetchMyOrders();
        } catch (error: any) {
            setSubmitError(error.message || "Failed to submit order proof. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetrySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");
        if (!retryForm.screenshot) {
            setSubmitError("Please upload an order screenshot.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                order_id: retryForm.orderId,
                amount: retryForm.amount,
                screenshot_url: retryForm.screenshot
            };

            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/orders/${activeOrder?.id}/retry`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Retry failed");
            }

            toast.success("Order Resubmitted for Admin Verification!");
            setIsRetryModalOpen(false);
            fetchMyOrders();
        } catch (error: any) {
            setSubmitError(error.message || "Failed to retry order. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "Order Validating":
            case "SUBMITTED":
                return (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5 py-1 px-2.5">
                        <Clock className="w-3 h-3 animate-spin" />
                        Order Validating
                    </Badge>
                );
            case "Order Confirmed (dating)":
            case "Order Confirmed":
                return (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 py-1 px-2.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Order Confirmed
                    </Badge>
                );
            case "Order Cancelled":
                return (
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1.5 py-1 px-2.5">
                        <XCircle className="w-3 h-3 text-gray-500" />
                        Order Cancelled
                    </Badge>
                );
            case "Order Rejected (No More Slots)":
                return (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1.5 py-1 px-2.5">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        Rejected (No Slots)
                    </Badge>
                );
            case "Order Approved (After Submission of Review SS & Return Window SS)":
                return (
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 flex items-center gap-1.5 py-1 px-2.5">
                        <Sparkles className="w-3 h-3 text-teal-600" />
                        Order Approved (Proofs OK)
                    </Badge>
                );
            case "Refund Processing (15 days of Order Confirmation)":
                return (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1.5 py-1 px-2.5">
                        <Wallet className="w-3 h-3 text-purple-600" />
                        Refund Processing (15d)
                    </Badge>
                );
            case "Refund Reject, Wrong Written":
                return (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1.5 py-1 px-2.5">
                        <AlertTriangle className="w-3 h-3 text-orange-600" />
                        Refund Reject (Wrong Written)
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        {status}
                    </Badge>
                );
        }
    };

    // Calculate totals
    const walletBalance = userProfile?.wallet_balance || 0;
    const validatingCount = orders.filter(o => o.status === "Order Validating" || o.status === "SUBMITTED").length;
    const confirmedCount = orders.filter(o => o.status === "Order Confirmed (dating)" || o.status === "Order Confirmed").length;
    const approvedCount = orders.filter(o => o.status === "Order Approved (After Submission of Review SS & Return Window SS)").length;
    const refundedCount = orders.filter(o => o.status.includes("Refund Processing") || o.refundStatus === "REFUNDED").length;

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Track Order Status & Payouts</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manual review verification, automated confirmation emails, and instant UPI wallet settlements.
                    </p>
                </div>
                <Button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[#eb5757] hover:bg-[#d64c4c] text-white shadow-sm font-semibold rounded-lg"
                >
                    Submit New Order
                </Button>
            </div>

            {/* Wallet Settlement & Balance Hero Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 bg-gradient-to-br from-gray-900 via-neutral-900 to-black text-white p-6 rounded-2xl shadow-xl border border-gray-800 relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div>
                            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium flex items-center gap-1.5">
                                <Wallet className="w-3.5 h-3.5 text-red-400" />
                                Available Wallet Balance
                            </span>
                            <div className="text-4xl font-extrabold tracking-tight mt-1 text-white">
                                ₹{walletBalance.toFixed(2)}
                            </div>
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Approved refunds are automatically collected and credited to this wallet.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <Button 
                                onClick={() => setIsWithdrawModalOpen(true)}
                                className="bg-[#eb5757] hover:bg-[#d64c4c] text-white font-semibold h-11 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2"
                            >
                                <ArrowUpRight className="w-4 h-4" />
                                Withdraw via UPI
                            </Button>
                            {userProfile?.upi_id && (
                                <span className="text-[11px] text-gray-400 text-center font-mono">
                                    VPA: {userProfile.upi_id}
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Active Pipeline</span>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                                <div className="text-xs text-amber-700 font-medium">Validating</div>
                                <div className="text-xl font-bold text-amber-900 mt-0.5">{validatingCount}</div>
                            </div>
                            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                                <div className="text-xs text-emerald-700 font-medium">Confirmed</div>
                                <div className="text-xl font-bold text-emerald-900 mt-0.5">{confirmedCount}</div>
                            </div>
                            <div className="bg-teal-50 p-2.5 rounded-lg border border-teal-100">
                                <div className="text-xs text-teal-700 font-medium">Approved</div>
                                <div className="text-xl font-bold text-teal-900 mt-0.5">{approvedCount}</div>
                            </div>
                            <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                                <div className="text-xs text-purple-700 font-medium">Refunded</div>
                                <div className="text-xl font-bold text-purple-900 mt-0.5">{refundedCount}</div>
                            </div>
                        </div>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-4 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Verification updates send automated email notices.
                    </div>
                </Card>
            </div>

            {/* Lifecycle Guide Alert */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80 text-xs text-gray-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">!</span>
                    <span>
                        <strong>Order Lifecycle Guide:</strong> Orders start at <strong>Order Validating</strong> ➔ Verified & Confirmed by Admin with email confirmation ➔ Upload Review & Return Window SS ➔ Approved for Refund & Wallet Credit.
                    </span>
                </div>
                <button 
                    onClick={() => { fetchMyOrders(); fetchUserProfile(); }} 
                    className="inline-flex items-center gap-1 text-gray-700 hover:text-black font-semibold text-xs shrink-0"
                >
                    <RefreshCw className="w-3 h-3" /> Refresh Status
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                    <Input
                        placeholder="Search by product name or Order ID..."
                        value={searchTermFilter}
                        onChange={(e) => setSearchTermFilter(e.target.value)}
                        className="bg-white border-gray-200 h-10 rounded-lg text-sm"
                    />
                </div>
                <select
                    className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-red-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">All Statuses ({orders.length})</option>
                    <option value="Order Validating">1. Order Validating</option>
                    <option value="Order Confirmed (dating)">2. Order Confirmed</option>
                    <option value="Order Cancelled">3. Order Cancelled</option>
                    <option value="Order Rejected (No More Slots)">4. Rejected (No More Slots)</option>
                    <option value="Order Approved (After Submission of Review SS & Return Window SS)">5. Order Approved</option>
                    <option value="Refund Processing (15 days of Order Confirmation)">6. Refund Processing (15d)</option>
                    <option value="Refund Reject, Wrong Written">7. Refund Reject (Wrong Written)</option>
                </select>
                <select
                    className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-red-500"
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

            {/* Orders Feed */}
            {isLoading ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    Loading your submissions...
                </div>
            ) : (() => {
                const filteredOrders = orders.filter((req) => {
                    const searchStr = searchTermFilter.toLowerCase();
                    const matchesSearch =
                        (req.productName?.toLowerCase() || "").includes(searchStr) ||
                        (req.order_id?.toLowerCase() || "").includes(searchStr);

                    let matchesStatus = true;
                    if (statusFilter !== "ALL") {
                        matchesStatus = 
                            req.status === statusFilter ||
                            (statusFilter === "Order Validating" && req.status === "SUBMITTED") ||
                            (statusFilter === "Order Confirmed (dating)" && req.status === "Order Confirmed");
                    }

                    const matchesDate = isDateMatch(req.created_at, dateFilter);
                    return matchesSearch && matchesStatus && matchesDate;
                });

                if (filteredOrders.length === 0) {
                    return (
                        <Card className="p-12 text-center border-dashed border-gray-200 bg-gray-50/50 rounded-2xl">
                            <p className="text-gray-500 font-medium">
                                {orders.length === 0 ? "You haven't submitted any orders yet." : "No orders found matching filters."}
                            </p>
                            <Button 
                                onClick={() => setIsAddModalOpen(true)} 
                                variant="outline" 
                                className="mt-4 border-gray-300"
                            >
                                Submit Your First Order
                            </Button>
                        </Card>
                    );
                }

                return (
                    <div className="space-y-4">
                        {filteredOrders.map((req) => {
                            const isPending = req.status === "Order Validating" || req.status === "SUBMITTED";
                            const isConfirmed = req.status === "Order Confirmed (dating)" || req.status === "Order Confirmed";
                            const isRejected = req.status.includes("Reject") || req.status === "REJECTED";
                            const isApproved = req.status.includes("Approved");
                            const isRefundProcessing = req.status.includes("Refund Processing");

                            return (
                                <Card key={req.id} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-all">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="font-bold text-gray-900 text-base">
                                                    {req.productName}
                                                </h3>
                                                {renderStatusBadge(req.status)}
                                                <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                                    {req.platform}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                                <span>
                                                    Order ID: <strong className="font-mono text-gray-800">{req.order_id}</strong>
                                                </span>
                                                <span>
                                                    Refund Value: <strong className="text-emerald-600 font-semibold">₹{req.refundAmount}</strong>
                                                </span>
                                                <span>
                                                    Date: {new Date(req.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Status Description Callout */}
                                            {isPending && (
                                                <div className="text-xs text-amber-700 bg-amber-50/80 border border-amber-200/60 p-2 rounded-lg flex items-center gap-2 max-w-xl">
                                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Our admin team is manually reviewing your order proof. You will receive an email confirmation once verified.</span>
                                                </div>
                                            )}

                                            {isConfirmed && !req.hasReview && (
                                                <div className="text-xs text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 p-2 rounded-lg flex items-center gap-2 max-w-xl">
                                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Order confirmed & verified! Please submit your Review Screenshot & Return Window Screenshot once the item arrives.</span>
                                                </div>
                                            )}

                                            {req.remarks && req.remarks !== req.status && (
                                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 max-w-xl">
                                                    <strong>Note:</strong> {req.remarks}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2 lg:self-center">
                                            {isRejected && (
                                                <Button 
                                                    size="sm" 
                                                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                                                    onClick={() => openRetryModal(req)}
                                                >
                                                    Retry Order
                                                </Button>
                                            )}

                                            {isConfirmed && !req.hasReview && (
                                                <Button 
                                                    size="sm" 
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                                                    onClick={() => openRefundModal(req)}
                                                >
                                                    <UploadCloud className="w-3.5 h-3.5" />
                                                    Submit Review & Return Proofs
                                                </Button>
                                            )}

                                            {req.hasReview && !isApproved && !isRefundProcessing && (
                                                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 py-1 px-3">
                                                    Review Proofs Uploaded (Under Admin Review)
                                                </Badge>
                                            )}

                                            {isApproved && (
                                                <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 py-1 px-3 font-semibold">
                                                    ✓ Approved for Settlement
                                                </Badge>
                                            )}

                                            {isRefundProcessing && (
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 py-1 px-3 font-semibold">
                                                    ₹ Credited to Wallet
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                );
            })()}

            {/* Instant UPI Withdrawal Modal */}
            <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
                            <Wallet className="w-5 h-5 text-red-500" />
                            Withdraw Funds to UPI
                        </DialogTitle>
                        <CardDescription className="text-xs text-gray-500">
                            Transfer your internal wallet balance directly to your bank account via UPI VPA.
                        </CardDescription>
                    </DialogHeader>
                    <form onSubmit={handleWithdrawUpi} className="space-y-4 pt-2">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <span className="text-xs text-gray-500 block">Available Balance</span>
                            <span className="text-2xl font-bold text-gray-900">₹{walletBalance.toFixed(2)}</span>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-gray-700">Withdrawal Amount (₹) <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                required
                                min="1"
                                max={walletBalance}
                                placeholder="Enter amount to withdraw"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-gray-700">UPI Virtual Payment Address (VPA) <span className="text-red-500">*</span></Label>
                            <Input
                                required
                                placeholder="e.g. yourname@okaxis or 9876543210@paytm"
                                value={withdrawUpi}
                                onChange={(e) => setWithdrawUpi(e.target.value)}
                                className="mt-1 font-mono text-sm"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Make sure this UPI address is active and linked to your bank account.</p>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsWithdrawModalOpen(false)}>Cancel</Button>
                            <Button 
                                type="submit" 
                                disabled={isWithdrawing || walletBalance <= 0} 
                                className="bg-[#eb5757] hover:bg-[#d64c4c] text-white font-semibold"
                            >
                                {isWithdrawing ? "Processing UPI..." : "Confirm & Transfer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Proofs Submission Modal (Review SS & Return Window SS) */}
            <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900">Submit Review & Return Proofs</DialogTitle>
                        <CardDescription className="text-xs text-gray-500">
                            Required to approve and settle your refund into your wallet.
                        </CardDescription>
                    </DialogHeader>
                    {activeOrder && (
                        <form onSubmit={handleApplyRefundSubmit} className="space-y-4 pt-2">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                                <strong className="text-gray-900 block">{activeOrder.productName}</strong>
                                <span className="text-gray-500">Order ID: {activeOrder.order_id} • Refund: ₹{activeOrder.refundAmount}</span>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Manager / Agent Name (Optional)</Label>
                                <Input
                                    className="mt-1 bg-white text-xs"
                                    placeholder="Enter Manager Name if assigned"
                                    value={managerName}
                                    onChange={(e) => setManagerName(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-gray-700">1. Review Screenshot <span className="text-red-500">*</span></Label>
                                <p className="text-[11px] text-gray-500 mb-1.5">Screenshot showing your published 5-star review on the ecommerce platform.</p>
                                <ImageUpload
                                    value={reviewScreenshot}
                                    onChange={(val) => setReviewScreenshot(val)}
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-gray-700">2. Return Window Screenshot (Optional / Recommended)</Label>
                                <p className="text-[11px] text-gray-500 mb-1.5">Screenshot showing return window has closed or product has been accepted.</p>
                                <ImageUpload
                                    value={returnWindowScreenshot}
                                    onChange={(val) => setReturnWindowScreenshot(val)}
                                />
                            </div>

                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsRefundModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                                    {isSubmitting ? "Submitting Proofs..." : "Submit Proofs for Approval"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Retry Modal */}
            <Dialog open={isRetryModalOpen} onOpenChange={setIsRetryModalOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900">Resubmit Rejected Order</DialogTitle>
                    </DialogHeader>
                    {activeOrder && (
                        <form className="space-y-4 pt-2" onSubmit={handleRetrySubmit}>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <span className="font-semibold text-red-800 text-xs block">Rejection Remark:</span>
                                <p className="text-xs text-red-700 mt-0.5">{activeOrder.remarks || "No remark provided."}</p>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold">Order ID <span className="text-red-500">*</span></Label>
                                <Input
                                    className="mt-1 bg-white font-mono text-sm"
                                    required
                                    value={retryForm.orderId}
                                    onChange={(e) => setRetryForm({ ...retryForm, orderId: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold">New Full Order Screenshot <span className="text-red-500">*</span></Label>
                                <div className="mt-1.5">
                                    <ImageUpload
                                        value={retryForm.screenshot}
                                        onChange={(val) => setRetryForm({ ...retryForm, screenshot: val })}
                                    />
                                </div>
                            </div>
                            {submitError && <p className="text-red-500 text-xs text-center">{submitError}</p>}
                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsRetryModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                                    {isSubmitting ? "Submitting..." : "Resubmit for Validation"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Submit New Order Modal */}
            <Dialog
                open={isAddModalOpen}
                onOpenChange={(isOpen) => setIsAddModalOpen(isOpen)}
            >
                <DialogContent className="sm:max-w-md bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900">Submit New Order Proof</DialogTitle>
                        <CardDescription className="text-xs text-gray-500">
                            Your order will enter <strong>Order Validating</strong> status. Once verified by the admin team, you will receive an email confirmation.
                        </CardDescription>
                    </DialogHeader>
                    <form className="space-y-4 pt-2" onSubmit={handleAddSubmit}>
                        <div>
                            <Label className="text-xs font-semibold text-gray-700">Select Campaign / Product <span className="text-red-500">*</span></Label>
                            <Select
                                value={orderForm.productId}
                                onValueChange={(val) => setOrderForm({ ...orderForm, productId: val })}
                                disabled={!!autoSubmitId}
                            >
                                <SelectTrigger className="w-full mt-1 bg-white">
                                    <SelectValue placeholder="Select active campaign..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.product_name} ({p.platform} - ₹{p.refund_amount})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-gray-700">Order ID <span className="text-red-500">*</span></Label>
                            <Input
                                className="mt-1 bg-white font-mono text-sm"
                                placeholder="e.g. 402-1234567-8901234"
                                required
                                value={orderForm.orderId}
                                onChange={(e) => setOrderForm({ ...orderForm, orderId: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-gray-700">Amount Paid (₹) <span className="text-red-500">*</span></Label>
                            <Input
                                className="mt-1 bg-white"
                                placeholder="₹"
                                type="number"
                                required
                                min="1"
                                value={orderForm.amount}
                                onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-gray-700">Profile Name on E-Commerce <span className="text-red-500">*</span></Label>
                            <Input
                                className="mt-1 bg-white"
                                placeholder="Enter profile name shown in order"
                                required
                                value={orderForm.profileName || ""}
                                onChange={(e) => setOrderForm({ ...orderForm, profileName: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-gray-700">Order Proof Screenshot <span className="text-red-500">*</span></Label>
                            <p className="text-[11px] text-gray-500 mb-1.5">
                                Please upload an uncropped screenshot showing your Order ID, Date, and Total Value.
                            </p>
                            <div className="mt-1">
                                <ImageUpload
                                    value={orderForm.screenshot}
                                    onChange={(val) => setOrderForm({ ...orderForm, screenshot: val })}
                                />
                            </div>
                        </div>

                        {submitError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{submitError}</p>}

                        <Button type="submit" className="w-full mt-4 bg-[#eb5757] hover:bg-[#d64c4c] text-white font-semibold" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting Proof..." : "Submit Order for Validation"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function CustomerSubmissions() {
    return (
        <Suspense fallback={<div className="py-16 text-center text-gray-500">Loading Order Submissions...</div>}>
            <CustomerSubmissionsContent />
        </Suspense>
    );
}

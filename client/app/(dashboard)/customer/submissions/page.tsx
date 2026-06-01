"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { isDateMatch, DateFilterType } from "@/lib/dateUtils";
import Link from "next/link";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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

    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [reviewLink, setReviewLink] = useState("");
    const [reviewScreenshot, setReviewScreenshot] = useState("");
    const [refundMethod, setRefundMethod] = useState<"UPI" | "BANK" | "QR">("UPI");
    const [upiId, setUpiId] = useState("");
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [bankDetails, setBankDetails] = useState({ accountName: "", accountNumber: "", ifsc: "" });

    // Add New Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [orderForm, setOrderForm] = useState({
        productId: "",
        orderId: "",
        amount: "",
        screenshot: ""
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            }
        } catch (error) {
            console.error("Failed to load user profile");
        }
    };

    useEffect(() => {
        if (!autoSubmitId) return;

        // Give priority to locally fetched products if they exist
        const matched = products.find(p => p.id === autoSubmitId);
        if (matched) {
            setOrderForm(prev => ({ ...prev, productId: matched.id }));
            setSearchQuery(`${matched.product_name} (${matched.platform} - ₹${matched.refund_amount})`);
            setIsAddModalOpen(true);
        } else if (products.length > 0) {
            // Only attempt exclusive fetch AFTER the main products array has loaded
            // to avoid race conditions where it fetches the campaign and then `products` reset it
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
                            setSearchQuery(`${data.product.product_name} (${data.product.platform} - ₹${data.product.refund_amount})`);
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

    const statusColor: Record<string, string> = {
        SUBMITTED: "bg-yellow-100 text-yellow-800",
        VERIFIED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
        REFUNDED: "bg-purple-100 text-purple-800"
    };

    const openRefundModal = (order: any) => {
        setActiveOrder(order);
        setIsRefundModalOpen(true);
        setReviewLink("");
        setReviewScreenshot("");

        let initialMethod: "UPI" | "BANK" = "UPI";
        let initialUpi = "";
        const initialBank = { accountName: "", accountNumber: "", ifsc: "" };

        if (userProfile?.encrypted_bank_data) {
            const bankStr = userProfile.encrypted_bank_data;
            if (bankStr.includes("Bank AC:")) {
                initialMethod = "BANK";
                // Regex or split to extract: `Bank AC: ${acc}, IFSC: ${ifsc}, Name: ${name}`
                const acMatch = bankStr.match(/Bank AC:\s*([^,]+)/);
                const ifscMatch = bankStr.match(/IFSC:\s*([^,]+)/);
                const nameMatch = bankStr.match(/Name:\s*(.+)/);
                if (acMatch) initialBank.accountNumber = acMatch[1].trim();
                if (ifscMatch) initialBank.ifsc = ifscMatch[1].trim();
                if (nameMatch) initialBank.accountName = nameMatch[1].trim();
            } else {
                initialMethod = "UPI";
                initialUpi = bankStr;
            }
        }

        setRefundMethod(initialMethod);
        setUpiId(initialUpi);
        setBankDetails(initialBank);
    };

    const handleApplyRefundSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewScreenshot) {
            toast.error("Please upload a screenshot of your review.");
            return;
        }
        setIsSubmitting(true);
        try {
            // Need the customer's mobile from their profile, but we can just ask for it or let backend infer from token
            // Wait, the backend endpoint `api/orders/:id/refund` currently requires `mobile` to verify ownership in the public route, but since they are logged in, we could pass a dummy mobile if needed, or update backend?
            // Actually, we can get the user profile first, or let backend just use the order's user_id directly. For now, passing a dummy '9999999999' or extracting mobile from their token if possible. Let's send a dummy mobile for now, wait the backend public route currently requires `mobile`.
            // Let's change the backend public route later or just pass dummy mobile.
            // Oh right, we can parse the JWT to get their mobile if needed.

            // To be safe, let's just make the request.
            const token = localStorage.getItem("token") || "";
            const payload = JSON.parse(atob(token.split('.')[1]));

            const res = await apiFetch(`${API_URL}/api/orders/${activeOrder.id}/refund`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    review_url: reviewLink,
                    review_screenshot: reviewScreenshot,
                    upi_id: refundMethod === "UPI" ? upiId : refundMethod === "QR" ? "QR Code Provided" : `Bank AC: ${bankDetails.accountNumber}, IFSC: ${bankDetails.ifsc}, Name: ${bankDetails.accountName}`,
                    qr_code_url: refundMethod === "QR" ? qrCodeUrl : "",
                    mobile: payload.mobile || ""
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }

            toast.success("Review link and refund details submitted successfully! Your refund will be processed shortly.");
            setIsRefundModalOpen(false);
            setActiveOrder(null);
            fetchMyOrders();
        } catch (error: any) {
            toast.error(error.message || "Failed to submit refund claim. Are you sure you haven't already applied?");
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
                screenshot_url: orderForm.screenshot
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

            toast.success("Order Proof Submitted Successfully!");
            setIsAddModalOpen(false);
            setOrderForm({ productId: "", orderId: "", amount: "", screenshot: "" });
            setSearchQuery("");
            fetchMyOrders();
        } catch (error: any) {
            setSubmitError(error.message || "Failed to submit order proof. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Submission of Proof</h1>
                    <p className="text-gray-500">Track your order statuses and claim refunds for successful reviews.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>Add New</Button>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by product name or order ID..."
                            value={searchTermFilter}
                            onChange={(e) => setSearchTermFilter(e.target.value)}
                        />
                    </div>
                    <select
                        className="flex h-10 w-full md:w-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="REFUNDED">Refunded</option>
                    </select>
                    <select
                        className="flex h-10 w-full md:w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
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

                {isLoading ? (
                    <p className="text-center text-gray-500 py-8">Loading submissions...</p>
                ) : (() => {
                    const filteredOrders = orders.filter((req) => {
                        const searchStr = searchTermFilter.toLowerCase();
                        const matchesSearch =
                            req.productName?.toLowerCase().includes(searchStr) ||
                            req.order_id?.toLowerCase().includes(searchStr);

                        // Adjust status filtering because `req.status` combines order and refund statuses contextually 
                        let matchesStatus = true;
                        if (statusFilter !== "ALL") {
                            matchesStatus = req.status === statusFilter;
                        }

                        const matchesDate = isDateMatch(req.created_at, dateFilter);

                        return matchesSearch && matchesStatus && matchesDate;
                    });

                    if (filteredOrders.length === 0) {
                        return <p className="text-center text-gray-500 py-8">{orders.length === 0 ? "You haven't submitted any orders yet." : "No submissions found matching filters."}</p>;
                    }

                    return filteredOrders.map((req) => (
                        <Card key={req.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-blue-100 shadow-sm">
                            <div className="space-y-2">
                                <CardTitle className="text-lg">{req.productName}</CardTitle>
                                <CardDescription>
                                    Order ID: {req.order_id} • {req.platform} • Refund: ₹{req.refundAmount}
                                </CardDescription>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-md ${statusColor[req.status] || "bg-gray-100 text-gray-800"}`}>
                                        Order {req.status}
                                    </span>
                                    {req.hasReview && <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Review Uploaded</Badge>}
                                    {req.hasRefund && (
                                        <Badge variant="outline"
                                            className={
                                                req.refundStatus === 'REFUNDED' ? "border-green-200 text-green-700 bg-green-50" :
                                                    req.refundStatus === 'FAILED' ? "border-red-200 text-red-700 bg-red-50" :
                                                        req.refundStatus === 'PROCESSING' ? "border-blue-200 text-blue-700 bg-blue-50" :
                                                            req.refundStatus === 'APPROVED' ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                                                                "border-purple-200 text-purple-700 bg-purple-50"
                                            }
                                        >
                                            Refund {req.refundStatus === 'REFUNDED' ? 'Processed' : req.refundStatus === 'FAILED' ? 'Failed' : req.refundStatus === 'APPROVED' ? 'Approved' : req.refundStatus === 'PROCESSING' ? 'Processing' : 'Pending'}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 min-w-[200px]">
                                {!req.hasRefund && !req.hasReview ? (
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        onClick={() => openRefundModal(req)}
                                    >
                                        Apply for Refund
                                    </Button>
                                ) : (
                                    <Button variant="outline" disabled className="w-full">
                                        {req.refundStatus === 'REFUNDED' ? 'Refund Completed' : req.refundStatus === 'FAILED' ? 'Refund Failed' : req.refundStatus === 'APPROVED' ? 'Refund Approved' : req.refundStatus === 'PROCESSING' ? 'Refund Processing' : 'Refund Requested'}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ));
                })()}
            </div>

            <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Apply for Refund</DialogTitle>
                    </DialogHeader>
                    {activeOrder && (
                        <form onSubmit={handleApplyRefundSubmit} className="space-y-4 pt-4">
                            <div>
                                <h4 className="font-semibold text-lg">{activeOrder.productName}</h4>
                                <p className="text-sm text-gray-500 mb-4">Submit your review link and claim your ₹{activeOrder.refundAmount} refund.</p>
                            </div>
                            <div className="space-y-1">
                                <Label>Review URL Link</Label>
                                <Input placeholder={`Link to your ${activeOrder.platform} review (Optional)`} value={reviewLink} onChange={e => setReviewLink(e.target.value)} />
                            </div>

                            <div className="space-y-1 mt-4">
                                <Label>Review Screenshot <span className="text-red-500">*</span></Label>
                                <p className="text-xs text-red-600 font-medium my-1.5 flex items-start gap-1 p-2 bg-red-50 rounded-md border border-red-100">
                                    <span className="text-red-600 mt-0.5">⚠️</span>
                                    Please upload a "Full Long Screenshot" showing your published review along with your actual Order ID, Customer Name, and Total Order Value. Uncropped full screenshots are required for AI verification.
                                </p>
                                <div className="mt-2">
                                    <ImageUpload
                                        value={reviewScreenshot}
                                        onChange={(val) => setReviewScreenshot(val)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label>Refund Method <span className="text-red-500">*</span></Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" className="w-4 h-4 text-blue-600" checked={refundMethod === "UPI"} onChange={() => setRefundMethod("UPI")} />
                                        <span className="text-sm">UPI</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" className="w-4 h-4 text-blue-600" checked={refundMethod === "BANK"} onChange={() => setRefundMethod("BANK")} />
                                        <span className="text-sm">Bank Account</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" className="w-4 h-4 text-blue-600" checked={refundMethod === "QR"} onChange={() => setRefundMethod("QR")} />
                                        <span className="text-sm">QR Code</span>
                                    </label>
                                </div>
                            </div>

                            {refundMethod === "UPI" ? (
                                <div className="space-y-1">
                                    <Label>UPI ID <span className="text-red-500">*</span></Label>
                                    <Input required placeholder="Enter UPI ID (e.g. yourname@upi)" value={upiId} onChange={e => setUpiId(e.target.value)} />
                                </div>
                            ) : refundMethod === "QR" ? (
                                <div className="space-y-2 border p-4 rounded-lg bg-gray-50">
                                    <Label>Upload Payment QR Code <span className="text-red-500">*</span></Label>
                                    <p className="text-xs text-gray-500 mb-2">Upload a clear image of your PhonePe/GPay/Paytm QR Code.</p>
                                    <ImageUpload
                                        value={qrCodeUrl}
                                        onChange={setQrCodeUrl}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3 border p-4 rounded-lg bg-gray-50">
                                    <div className="space-y-1">
                                        <Label>Account Holder Name <span className="text-red-500">*</span></Label>
                                        <Input required placeholder="e.g. John Doe" value={bankDetails.accountName} onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Account Number <span className="text-red-500">*</span></Label>
                                        <Input required placeholder="Enter Account Number" type="password" value={bankDetails.accountNumber} onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>IFSC Code <span className="text-red-500">*</span></Label>
                                        <Input required placeholder="e.g. HDFC0001234" value={bankDetails.ifsc} onChange={e => setBankDetails({ ...bankDetails, ifsc: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsRefundModalOpen(false)}>Back</Button>
                                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                                    {isSubmitting ? "Submitting..." : "Apply for Refund"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={isAddModalOpen}
                onOpenChange={(isOpen) => {
                    if (!isOpen && autoSubmitId) {
                        const confirmCancel = window.confirm("Are you sure you want to cancel submitting the order proof for this exclusive campaign?");
                        if (!confirmCancel) return;
                    }
                    setIsAddModalOpen(isOpen);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Submit New Order Proof</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4 pt-4" onSubmit={handleAddSubmit}>
                        <div>
                            <Label>Search & Select Product / Campaign <span className="text-red-500">*</span></Label>

                            <Select
                                value={orderForm.productId}
                                onValueChange={(val) => setOrderForm({ ...orderForm, productId: val })}
                                disabled={!!autoSubmitId}
                            >
                                <SelectTrigger className="w-full mt-1 bg-white">
                                    <SelectValue placeholder="Select a product from the list..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.product_name} ({p.platform} - ₹{p.refund_amount})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {products.length === 0 && <p className="text-xs text-red-500 mt-1">No active campaigns available to submit orders for.</p>}
                        </div>
                        <div>
                            <Label>Order ID <span className="text-red-500">*</span></Label>
                            <Input
                                className="mt-1 bg-white"
                                placeholder="Enter Order ID"
                                required
                                value={orderForm.orderId}
                                onChange={(e) => setOrderForm({ ...orderForm, orderId: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Total Amount Paid <span className="text-red-500">*</span></Label>
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
                            <Label>Order Screenshot <span className="text-red-500">*</span></Label>
                            <p className="text-xs text-red-600 font-medium my-1.5 flex items-start gap-1 p-2 bg-red-50 rounded-md border border-red-100">
                                <span className="text-red-600 mt-0.5">⚠️</span>
                                Please upload an uncropped "Full Long Screenshot" that clearly shows your actual Order ID, Customer Name, and Total Order Value. Small or cropped screenshots will be rejected by the AI.
                            </p>
                            <div className="mt-2">
                                <ImageUpload
                                    value={orderForm.screenshot}
                                    onChange={(val) => setOrderForm({ ...orderForm, screenshot: val })}
                                />
                            </div>
                        </div>

                        {submitError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{submitError}</p>}

                        <Button type="submit" className="w-full mt-4" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Order Details"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function CustomerSubmissions() {
    return (
        <Suspense fallback={<div className="py-12 text-center">Loading...</div>}>
            <CustomerSubmissionsContent />
        </Suspense>
    );
}

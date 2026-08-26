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
    const [reviewScreenshot, setReviewScreenshot] = useState("");

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
        setReviewScreenshot("");
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

            // We default to the profile's encrypted bank data for the refund method
            const defaultUpiId = userProfile?.encrypted_bank_data || "Default Account";

            const res = await apiFetch(`${API_URL}/api/orders/${activeOrder.id}/refund`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    review_url: "",
                    review_screenshot: reviewScreenshot,
                    upi_id: defaultUpiId,
                    qr_code_url: "",
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

                    
                    return (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                                    <tr>
                                        <th className="px-4 py-3">Product Name</th>
                                        <th className="px-4 py-3">Order ID & Platform</th>
                                        <th className="px-4 py-3">Refund Amount</th>
                                        <th className="px-4 py-3">Order Status</th>
                                        <th className="px-4 py-3">Review Status</th>
                                        <th className="px-4 py-3">Refund Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredOrders.map((req) => {
                                        const orderDate = req.created_at ? new Date(req.created_at) : new Date();
                                        const now = new Date();
                                        const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
                                        
                                        const isReviewLocked = daysSinceOrder < 5;
                                        const isRefundLocked = daysSinceOrder < 10;

                                        return (
                                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 font-medium text-gray-900 max-w-[200px] truncate" title={req.productName}>
                                                    {req.productName}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded inline-block mb-1">{req.order_id}</div>
                                                    <div className="text-gray-500 text-xs">{req.platform}</div>
                                                </td>
                                                <td className="px-4 py-4 font-semibold text-green-600">
                                                    ₹{req.refundAmount}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-md ${statusColor[req.status] || "bg-gray-100 text-gray-800"}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {req.hasReview ? (
                                                        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Uploaded</Badge>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {req.hasRefund ? (
                                                        <Badge variant="outline"
                                                            className={
                                                                req.refundStatus === 'REFUNDED' ? "border-green-200 text-green-700 bg-green-50" :
                                                                req.refundStatus === 'FAILED' ? "border-red-200 text-red-700 bg-red-50" :
                                                                req.refundStatus === 'PROCESSING' ? "border-blue-200 text-blue-700 bg-blue-50" :
                                                                req.refundStatus === 'APPROVED' ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                                                                "border-purple-200 text-purple-700 bg-purple-50"
                                                            }
                                                        >
                                                            {req.refundStatus}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Not requested</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {!req.hasRefund && !req.hasReview ? (
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700"
                                                            onClick={() => openRefundModal(req)}
                                                            disabled={isRefundLocked}
                                                            title={isRefundLocked ? `Unlocks in ${10 - daysSinceOrder} days` : "Apply for Refund"}
                                                        >
                                                            {isRefundLocked ? `🔒 Wait ${10 - daysSinceOrder}d` : "Apply for Refund"}
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="outline" disabled className="text-xs">
                                                            {req.refundStatus === 'REFUNDED' ? 'Completed' : req.refundStatus === 'FAILED' ? 'Failed' : req.refundStatus === 'APPROVED' ? 'Approved' : req.refundStatus === 'PROCESSING' ? 'Processing' : 'Requested'}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );

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
                                <p className="text-sm text-gray-500 mb-4">Upload your review screenshot and claim your ₹{activeOrder.refundAmount} refund instantly.</p>
                            </div>

                            <div className="space-y-1 mt-4">
                                <Label>Review Screenshot <span className="text-red-500">*</span></Label>
                                <div className="mt-2">
                                    <ImageUpload
                                        value={reviewScreenshot}
                                        onChange={(val) => setReviewScreenshot(val)}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsRefundModalOpen(false)}>Back</Button>
                                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-foreground">
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

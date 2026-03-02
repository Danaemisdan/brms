"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ExternalLink, CheckCircle, CreditCard, XCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function AdminRefunds() {
    const [refundRequests, setRefundRequests] = useState<any[]>([]);
    const [queueStats, setQueueStats] = useState({
        reviewPending: 0,
        reviewInProgress: 0,
        whatsappPending: 0,
        whatsappInProgress: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRefunds();
    }, []);

    const fetchRefunds = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const [ordersRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/orders`, { headers }),
                fetch(`${API_URL}/api/refunds/tasks/stats`, { headers })
            ]);

            if (ordersRes.ok) {
                const data = await ordersRes.json();
                // Filter only orders that have an associated refund request
                const refunds = data.orders.filter((o: any) => o.refund != null);
                setRefundRequests(refunds);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                const review = statsData?.stats?.REVIEW_VERIFY || {};
                const whatsapp = statsData?.stats?.WHATSAPP_BLAST || {};
                setQueueStats({
                    reviewPending: review.PENDING || 0,
                    reviewInProgress: review.IN_PROGRESS || 0,
                    whatsappPending: whatsapp.PENDING || 0,
                    whatsappInProgress: whatsapp.IN_PROGRESS || 0
                });
            }
        } catch (error) {
            console.error("Failed to fetch refunds:");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, action: string) => {
        try {
            const token = localStorage.getItem("token");
            const status = action === "approved" ? "APPROVED" : action === "processed" ? "REFUNDED" : "FAILED";

            const res = await fetch(`${API_URL}/api/orders/${id}/refund/status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update refund.");
            }

            toast.success(`Refund mapped to order ID ${id} marked as ${status}.`);
            fetchRefunds(); // Refresh the data
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Refund Requests</h1>
                <p className="text-gray-500">Review customer refund submissions in a comprehensive spreadsheet view.</p>
            </div>

            <Card className="p-5 bg-white/50 backdrop-blur-sm border-blue-100 shadow-sm">
                <CardTitle className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-2">System Automation Queue</CardTitle>
                <div className="flex flex-wrap gap-4 text-sm font-medium">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                        <CheckCircle className="w-4 h-4" /> Review Verify: {queueStats.reviewPending} Pending | {queueStats.reviewInProgress} In-Progress
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200">
                        <CreditCard className="w-4 h-4" /> WhatsApp Blast: {queueStats.whatsappPending} Pending | {queueStats.whatsappInProgress} In-Progress
                    </span>
                </div>
            </Card>

            <div className="space-y-4">
                {isLoading ? (
                    <p className="text-center text-gray-500 py-8">Loading refund requests...</p>
                ) : refundRequests.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No refund requests found.</p>
                ) : (
                    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/80">
                                    <TableRow>
                                        <TableHead className="w-[180px] font-semibold text-gray-900">Customer</TableHead>
                                        <TableHead className="w-[200px] font-semibold text-gray-900">Product</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-900">Refund (₹)</TableHead>
                                        <TableHead className="font-semibold text-gray-900">Payment Details</TableHead>
                                        <TableHead className="font-semibold text-gray-900">Order ID</TableHead>
                                        <TableHead className="font-semibold text-gray-900">Review Proof</TableHead>
                                        <TableHead className="font-semibold text-gray-900">Status</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {refundRequests.map((req) => (
                                        <TableRow key={req.id} className="hover:bg-gray-50 hover:shadow-sm transition-colors">
                                            <TableCell>
                                                <div className="font-medium text-gray-900">{req.user?.name || "Customer"}</div>
                                                <div className="text-xs text-gray-500">{req.user?.mobile}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="line-clamp-2 text-sm text-gray-700 font-medium" title={req.product?.product_name}>
                                                    {req.product?.product_name || "Unknown Product"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-gray-900">
                                                ₹{req.refund?.amount}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] text-xs font-mono bg-gray-100 p-1.5 rounded text-gray-700 truncate" title={req.user?.encrypted_bank_data || "N/A"}>
                                                    {req.user?.encrypted_bank_data || "No Data"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-mono text-xs text-gray-600">{req.order_id}</div>
                                            </TableCell>
                                            <TableCell>
                                                {req.review?.screenshot_url ? (
                                                    <a href={req.review.screenshot_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
                                                        <ExternalLink className="w-3.5 h-3.5" /> View
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-red-500 flex items-center gap-1 font-medium"><XCircle className="w-3.5 h-3.5" /> Missing</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${req.refund?.status === "VERIFIED" ? "bg-green-100 text-green-800 border border-green-200" :
                                                    req.refund?.status === "REFUNDED" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                                        req.refund?.status === "FAILED" ? "bg-red-100 text-red-800 border border-red-200" :
                                                            "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                                    }`}>
                                                    {req.refund?.status || "PENDING"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {(!req.refund?.status || req.refund?.status === "PENDING") && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="h-8 text-xs font-medium border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => handleAction(req.order_id, "failed")}>
                                                                Reject
                                                            </Button>
                                                            <Button size="sm" className="h-8 text-xs font-medium bg-green-600 hover:bg-green-700" onClick={() => handleAction(req.order_id, "approved")}>
                                                                Approve
                                                            </Button>
                                                        </>
                                                    )}
                                                    {req.refund?.status === "PROCESSING" && (
                                                        <Button size="sm" className="h-8 text-xs font-medium bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(req.order_id, "processed")}>
                                                            Mark Paid
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

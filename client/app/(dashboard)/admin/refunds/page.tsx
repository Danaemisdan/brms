"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function AdminRefunds() {
    const [refundRequests, setRefundRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRefunds();
    }, []);

    const fetchRefunds = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter only orders that have an associated refund request
                const refunds = data.orders.filter((o: any) => o.refund != null);
                setRefundRequests(refunds);
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
                <p className="text-gray-500">Review customer refund submissions and verify with the bot.</p>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <p className="text-center text-gray-500 py-8">Loading refund requests...</p>
                ) : refundRequests.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No refund requests found.</p>
                ) : (
                    refundRequests.map((req) => (
                        <Card key={req.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">{req.user?.name || req.user?.mobile}</CardTitle>
                                <CardDescription>
                                    {req.product?.product_name} • ₹{req.refund?.amount} • UPI: <span className="font-mono text-xs text-black">{req.user?.encrypted_bank_data || "N/A"}</span>
                                </CardDescription>
                                <p className="text-sm mt-1">
                                    Review Screenshot URL: {req.review?.screenshot_url ? <a href={req.review.screenshot_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View Review</a> : <span className="text-red-600">Missing</span>}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${req.refund?.status === "VERIFIED" ? "bg-green-100 text-green-800" : req.refund?.status === "REFUNDED" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"}`}>
                                    {req.refund?.status || "PENDING"}
                                </span>
                                {(!req.refund?.status || req.refund?.status === "PENDING") && (
                                    <>
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(req.order_id, "approved")}>
                                            Approve Refund
                                        </Button>
                                    </>
                                )}
                                {req.refund?.status === "PROCESSING" && (
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(req.order_id, "processed")}>
                                        Mark as Paid
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

const API_URL = "";

export default function BrandRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data.products || []);
            }
        } catch (error) {
            console.error("Failed to fetch vendor requests.");
        } finally {
            setIsLoading(false);
        }
    };

    const statusColor: Record<string, string> = {
        ACTIVE: "bg-green-100 text-green-800",
        DRAFT: "bg-yellow-100 text-yellow-800",
        COMPLETED: "bg-blue-100 text-blue-800",
        DECLINED: "bg-red-100 text-red-800",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
                <p className="text-gray-500">Track all your product requests and their progress.</p>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <p className="text-center text-gray-500 py-8">Loading history...</p>
                ) : requests.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No requests found.</p>
                ) : (
                    requests.map((req) => (
                        <Card key={req.id} className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg">{req.product_name}</CardTitle>
                                    <CardDescription>
                                        {req.platform} • ₹{req.refund_amount}/review • Requested: {new Date(req.created_at).toLocaleDateString()}
                                    </CardDescription>
                                    {req.status === "ACTIVE" && (
                                        <p className="text-sm text-gray-500 mt-1">Progress: {req.filled_slots}/{req.total_slots} orders filled</p>
                                    )}
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full self-start sm:self-center shrink-0 ${statusColor[req.status] || "bg-gray-100 text-gray-800"}`}>
                                    {req.status === "DRAFT" ? "PENDING APPROVAL" : req.status}
                                </span>
                            </div>

                            {/* Placed Orders Tracker */}
                            {req.orders && req.orders.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-semibold mb-2">Placed Orders Log</h4>
                                    <div className="space-y-2">
                                        {req.orders.map((order: any) => (
                                            <div key={order.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs">{order.order_id}</span>
                                                    <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${order.status === "VALIDATED" ? "bg-green-100 text-green-700" :
                                                    order.status === "REJECTED" ? "bg-red-100 text-red-700" :
                                                        "bg-blue-100 text-blue-700"
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

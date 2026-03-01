"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Failed to fetch orders:");
        } finally {
            setIsLoading(false);
        }
    };

    const statusColor: Record<string, string> = {
        SUBMITTED: "bg-blue-100 text-blue-800",
        VALIDATING: "bg-yellow-100 text-yellow-800",
        VALIDATED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">All Orders</h1>
                <p className="text-gray-500">View all customer orders across campaigns.</p>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <p className="text-center text-gray-500 py-8">Loading orders...</p>
                ) : orders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No orders found.</p>
                ) : (
                    orders.map((order) => (
                        <Card key={order.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">{order.product?.product_name || "Unknown Product"}</CardTitle>
                                <CardDescription>
                                    {order.user?.name || order.user?.mobile} • {order.product?.platform} • <span className="font-mono text-xs text-black">{order.order_id}</span> • {new Date(order.created_at).toLocaleDateString()}
                                </CardDescription>
                                {order.screenshot_url && order.screenshot_url !== "https://dummyimage.com/600x400/000/fff&text=Order+Screenshot" && (
                                    <a href={order.screenshot_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">View Screenshot</a>
                                )}
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColor[order.status] || "bg-gray-100 text-gray-800"}`}>
                                {order.status}
                            </span>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

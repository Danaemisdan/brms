"use client";

import { apiFetch } from "@/lib/apiFetch";
import { useEffect, useState, Suspense } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_URL = "";

function BrandOrdersContent() {
    const [orders, setOrders] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState({ totalOrders: 0, totalSpent: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchBrandOrders();
    }, []);

    const fetchBrandOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/orders/brand-orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
                setAnalytics(data.analytics || { totalOrders: 0, totalSpent: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch brand orders", error);
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Brand Orders</h1>
                <p className="text-gray-500 mt-1">View collected orders for your products and analytics.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Orders Collected</p>
                                <p className="text-3xl font-bold text-gray-900">{analytics.totalOrders}</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Campaign Value</p>
                                <p className="text-3xl font-bold text-gray-900">₹{analytics.totalSpent}</p>
                            </div>
                            <div className="p-3 bg-green-50 text-green-600 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="p-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by Order ID or Product Name..."
                    className="w-full px-4 py-2 border rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Card>

            {isLoading ? (
                <p className="text-center text-gray-500 py-8">Loading orders...</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                            <tr>
                                <th className="px-4 py-3">Order Date</th>
                                <th className="px-4 py-3">Product Name</th>
                                <th className="px-4 py-3">Customer Name</th>
                                <th className="px-4 py-3">Order ID</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.filter(o => 
                                (o.order_id || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (o.product?.product_name || "").toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 font-medium text-gray-900 max-w-[200px] truncate">
                                        {order.product?.product_name}
                                    </td>
                                    <td className="px-4 py-4 text-gray-600">
                                        {order.user?.name}
                                    </td>
                                    <td className="px-4 py-4 font-mono text-xs">
                                        {order.order_id}
                                    </td>
                                    <td className="px-4 py-4 text-gray-900">
                                        ₹{order.amount}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md ${statusColor[order.status] || "bg-gray-100 text-gray-800"}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No orders have been submitted for your brand yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function BrandOrders() {
    return (
        <Suspense fallback={<div className="py-12 text-center text-gray-500">Loading dashboard...</div>}>
            <BrandOrdersContent />
        </Suspense>
    );
}

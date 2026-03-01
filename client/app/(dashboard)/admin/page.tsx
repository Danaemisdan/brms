"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        activeProducts: 0,
        pendingRefunds: 0,
        totalCustomers: 0, // Using unique orders as a proxy for now
        totalRefunded: 0,
        pendingProducts: 0
    });

    // Using pending products for the pending vendors list for now
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [pendingRefundOrders, setPendingRefundOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [ordersRes, productsRes] = await Promise.all([
                fetch(`${API_URL}/api/orders`, { headers }),
                fetch(`${API_URL}/api/products`, { headers })
            ]);

            if (ordersRes.ok && productsRes.ok) {
                const ordersData = await ordersRes.json();
                const productsData = await productsRes.json();

                const orders = ordersData.orders || [];
                const products = productsData.products || [];

                const pendingRefundsCount = orders.filter((o: any) => o.refund?.status === "PENDING").length;
                const totalRefundAmount = orders.filter((o: any) => o.refund?.status === "REFUNDED").reduce((sum: number, o: any) => sum + o.refund.amount, 0);
                const uniqueCustomers = new Set(orders.map((o: any) => o.user_id)).size;
                const activeProducts = products.filter((p: any) => p.status === "ACTIVE").length;
                const draftProducts = products.filter((p: any) => p.status === "DRAFT");

                setStats({
                    activeProducts,
                    pendingRefunds: pendingRefundsCount,
                    totalCustomers: uniqueCustomers,
                    totalRefunded: totalRefundAmount,
                    pendingProducts: draftProducts.length
                });

                setPendingRequests(draftProducts);

                const recent = orders.filter((o: any) => o.status === "SUBMITTED").slice(0, 5);
                const refunds = orders.filter((o: any) => o.refund?.status === "PENDING").slice(0, 5);

                setRecentOrders(recent);
                setPendingRefundOrders(refunds);
            }
        } catch (error) {
            console.error("Failed to fetch admin dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = (id: number, action: string) => {
        toast.info(`Product #${id} ${action}d. (To be implemented)`);
    };

    const metrics = [
        { label: "Active Products", value: stats.activeProducts },
        { label: "Pending Products", value: stats.pendingProducts },
        { label: "Total Customers", value: stats.totalCustomers },
        { label: "Pending Refunds", value: stats.pendingRefunds },
        { label: "Total Vendors", value: "1 (Admin)" },
        { label: "Total Refunded", value: `₹${stats.totalRefunded}` },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500">Full control over products, vendors, customers, and refunds.</p>
            </div>

            {isLoading ? (
                <p className="text-gray-500 py-8">Loading dashboard metrics...</p>
            ) : (
                <>
                    {/* Metrics */}
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                        {metrics.map((m, i) => (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase">{m.label}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{m.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pending Vendor Requests */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900">Pending Products to List</h2>
                        {pendingRequests.length === 0 ? (
                            <p className="text-sm text-gray-500">No pending products waiting for approval.</p>
                        ) : (
                            pendingRequests.map((req) => (
                                <Card key={req.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">{req.product_name}</h3>
                                        <p className="text-sm text-gray-500">
                                            By <span className="font-medium text-gray-900">{req.brand}</span> • {req.platform} • {req.total_slots} slots • ₹{req.refund_amount}/review
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleAction(req.id, "decline")}>
                                            Delete
                                        </Button>
                                        <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleAction(req.id, "approve")}>
                                            Approve & List
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Action Required: Pending Refunds */}
                    <div className="space-y-4 pt-4">
                        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Action Required: Pending Refunds ({stats.pendingRefunds})</h2>
                        {pendingRefundOrders.length === 0 ? (
                            <p className="text-sm text-gray-500">No pending refunds require action.</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pendingRefundOrders.map((req) => (
                                    <Card key={req.id} className="p-4 border-yellow-200 bg-yellow-50/30">
                                        <CardHeader className="p-0 pb-2">
                                            <CardTitle className="text-md text-gray-900">Refund: ₹{req.product?.refund_amount}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0 space-y-2">
                                            <p className="text-sm text-gray-600">Product: <span className="font-medium text-gray-900">{req.product?.product_name}</span></p>
                                            <p className="text-sm text-gray-600">Order ID: <span className="font-medium text-gray-900">{req.order_id}</span></p>
                                            <p className="text-sm text-gray-600">Customer Mobile: <span className="font-medium text-gray-900">{req.user?.mobile}</span></p>
                                            <Button className="w-full mt-2 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => window.location.href = '/admin/refunds'}>
                                                Review Refund Request
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Order Submissions */}
                    <div className="space-y-4 pt-4">
                        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Recent Order Submissions</h2>
                        {recentOrders.length === 0 ? (
                            <p className="text-sm text-gray-500">No recent orders submitted.</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {recentOrders.map((req) => (
                                    <Card key={req.id} className="p-4 border-blue-100 bg-blue-50/30">
                                        <CardHeader className="p-0 pb-2">
                                            <CardTitle className="text-md text-gray-900">Order: {req.order_id}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0 space-y-2">
                                            <p className="text-sm text-gray-600">Product: <span className="font-medium text-gray-900">{req.product?.product_name}</span></p>
                                            <p className="text-sm text-gray-600">Customer Mobile: <span className="font-medium text-gray-900">{req.user?.mobile}</span></p>
                                            <p className="text-sm text-gray-600">Amount Paid: <span className="font-medium text-gray-900">₹{req.amount}</span></p>
                                            <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => window.location.href = '/admin/orders'}>
                                                View Request in Orders
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

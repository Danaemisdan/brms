"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isDateMatch, DateFilterType } from "@/lib/dateUtils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState<DateFilterType>("ALL");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/orders`, {
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">All Orders</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Live Google Sheets Link: <code className="bg-gray-100 p-1 rounded select-all">{`${API_URL}/api/orders/export?token=brms_export_secret_123`}</code>
                        <span className="text-xs ml-2">(Use `=IMPORTDATA("url")`)</span>
                    </p>
                </div>
                <a href={`${API_URL}/api/orders/export?token=brms_export_secret_123`} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                        Export to CSV
                    </Button>
                </a>
            </div>

            <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by order ID, mobile, or product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="flex h-10 w-full md:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="VALIDATING">Validating</option>
                        <option value="VALIDATED">Validated</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <select
                        className="flex h-10 w-full md:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            </Card>

            <div className="space-y-4">
                {isLoading ? (
                    <p className="text-center text-gray-500 py-8">Loading orders...</p>
                ) : (() => {
                    const filteredOrders = orders.filter(order => {
                        const matchesSearch =
                            order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.user?.mobile?.includes(searchTerm) ||
                            order.product?.product_name.toLowerCase().includes(searchTerm.toLowerCase());

                        const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
                        const matchesDate = isDateMatch(order.created_at, dateFilter);

                        return matchesSearch && matchesStatus && matchesDate;
                    });

                    if (filteredOrders.length === 0) {
                        return <p className="text-center text-gray-500 py-8">No orders found matching filters.</p>;
                    }

                    return filteredOrders.map((order) => (
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
                    ));
                })()}
            </div>
        </div>
    );
}

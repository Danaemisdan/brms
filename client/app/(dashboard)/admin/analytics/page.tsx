"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const API_URL = "";

export default function AdminAnalytics() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Unauthorized");

            const res = await apiFetch(`${API_URL}/api/analytics/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to fetch analytics");

            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading comprehensive analytics...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!data) return null;

    const { kpis, signupTrend, topProducts } = data;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-gray-500">Platform performance, growth trends, and financial metrics.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="bg-gradient-to-br from-blue-50 to-white shadow-sm border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{kpis.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-white shadow-sm border-purple-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-800">Registered Brands</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{kpis.totalBrands}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-white shadow-sm border-emerald-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800">Active Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{kpis.activeProducts}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-white shadow-sm border-orange-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800">Total Submissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{kpis.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-white shadow-sm border-red-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">Refunds Disbursed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-mono text-gray-900">₹{kpis.totalRefundedAmount.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* User Growth Trend */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Customer Signups (Last 30 Days)</CardTitle>
                        <CardDescription>Daily volume of new customer registrations</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={signupTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    stroke="#6B7280"
                                    fontSize={12}
                                />
                                <YAxis stroke="#6B7280" fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="signups"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Campaigns */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Top Volume Campaigns</CardTitle>
                        <CardDescription>Highest performing products by total unique order submissions</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" stroke="#6B7280" fontSize={12} allowDecimals={false} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={120}
                                    stroke="#6B7280"
                                    fontSize={11}
                                    tickFormatter={(val) => val.length > 20 ? val.substring(0, 18) + '...' : val}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="orders" fill="#10B981" radius={[0, 4, 4, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

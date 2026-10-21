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

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse text-xs tracking-widest uppercase">Loading analytics intelligence...</div>;
    if (error) return <div className="p-8 text-center text-rose-500">Error: {error}</div>;
    if (!data) return null;

    const { kpis, signupTrend, topProducts } = data;

    return (
        <div className="space-y-8 relative z-10 pb-16">
            <div className="border-b border-border/60 pb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-1.5 font-sans tracking-wide text-xs sm:text-sm">Platform performance, growth trends, and financial metrics.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-foreground">{kpis.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered Brands</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-foreground">{kpis.totalBrands}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-foreground">{kpis.activeProducts}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Total Submissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-foreground">{kpis.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Refunds Disbursed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">₹{kpis.totalRefundedAmount.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* User Growth Trend */}
                <Card className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-foreground tracking-tight">Customer Signups (Last 30 Days)</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">Daily volume of new customer registrations</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={signupTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                                <XAxis
                                    dataKey="label"
                                    stroke="currentColor"
                                    className="text-muted-foreground text-[11px]"
                                    interval={3}
                                />
                                <YAxis stroke="currentColor" className="text-muted-foreground text-xs" allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="signups"
                                    name="Signups"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    dot={{ r: 3, strokeWidth: 2 }}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="orders"
                                    name="Orders"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Campaigns */}
                <Card className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-foreground tracking-tight">Top Volume Campaigns</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">Highest performing products by total unique order submissions</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border/40" />
                                <XAxis type="number" stroke="currentColor" className="text-muted-foreground text-xs" allowDecimals={false} />
                                <YAxis
                                    dataKey="shortName"
                                    type="category"
                                    width={140}
                                    stroke="currentColor"
                                    className="text-muted-foreground text-[11px]"
                                />
                                <Tooltip
                                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                                />
                                <Bar dataKey="orders" fill="#10B981" radius={[0, 6, 6, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { isDateMatch, DateFilterType } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function BrandDashboard() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState<DateFilterType>("ALL");

    const [form, setForm] = useState({
        brand: "",
        productName: "",
        platform: "AMAZON",
        ordersNeeded: "",
        productLink: "",
        productImage: "",
        refundAmount: "",
        deliveryType: "ORIGINAL",
        exchangeImage: ""
    });

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
            console.error("Failed to fetch brand products.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/products`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    // Normally the backend would get client_id from auth, passing dummy for now
                    client_id: "5d0b58cf-aa25-4088-8032-4dbd913a4be4",
                    brand: form.brand,
                    product_name: form.productName,
                    product_image: form.productImage,
                    product_link: form.productLink,
                    platform: form.platform,
                    refund_amount: Number(form.refundAmount) || 0,
                    total_slots: Number(form.ordersNeeded) || 0,
                    daily_limit: 100,
                    deadline: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days defaults
                    instructions: "Buy on platform, leave a review after delivery, and share your screenshot here.",
                    delivery_type: form.deliveryType,
                    exchange_image: form.exchangeImage
                })
            });

            if (!res.ok) {
                throw new Error("Failed to post product request.");
            }

            toast.success("Product request submitted! It will appear when Admin approves it.");
            setForm({ brand: "", productName: "", platform: "AMAZON", ordersNeeded: "", productLink: "", productImage: "", refundAmount: "", deliveryType: "ORIGINAL", exchangeImage: "" });
            fetchProducts();
        } catch (error) {
            toast.error("Error submitting request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Brand Dashboard</h1>
                <p className="text-gray-500">Request products and track how many orders you need from us.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* New Product Request */}
                <Card>
                    <CardHeader>
                        <CardTitle>Request a New Product</CardTitle>
                        <CardDescription>Submit a product you want us to run a review campaign for.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="brand">Brand Name</Label>
                                    <Input id="brand" placeholder="e.g., Apple" required value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="productName">Product Name</Label>
                                    <Input id="productName" placeholder="e.g., Wireless Mouse" required value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="platform">Platform</Label>
                                    <select id="platform" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="AMAZON">Amazon</option>
                                        <option value="FLIPKART">Flipkart</option>
                                        <option value="MYNTRA">Myntra</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ordersNeeded">Orders Needed</Label>
                                    <Input id="ordersNeeded" type="number" placeholder="50" required value={form.ordersNeeded} onChange={e => setForm({ ...form, ordersNeeded: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="productLink">Product Link</Label>
                                <Input id="productLink" type="url" placeholder="https://amazon.in/dp/..." required value={form.productLink} onChange={e => setForm({ ...form, productLink: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="productImage">Main Product Image URL</Label>
                                    <Input id="productImage" type="url" placeholder="Optional image link" value={form.productImage} onChange={e => setForm({ ...form, productImage: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="refundAmount">Refund/Review (₹)</Label>
                                    <Input id="refundAmount" type="number" placeholder="1000" required value={form.refundAmount} onChange={e => setForm({ ...form, refundAmount: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Vendor Delivery Type</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={form.deliveryType}
                                        onChange={e => setForm({ ...form, deliveryType: e.target.value })}
                                    >
                                        <option value="ORIGINAL">Original Product</option>
                                        <option value="EXCHANGE">Exchange Product</option>
                                    </select>
                                </div>

                                {form.deliveryType === "EXCHANGE" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="exchangeImage">Exchange Product Photo URL</Label>
                                        <Input
                                            id="exchangeImage"
                                            type="url"
                                            placeholder="Link to exchange item photo"
                                            required={form.deliveryType === "EXCHANGE"}
                                            value={form.exchangeImage}
                                            onChange={e => setForm({ ...form, exchangeImage: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                                {isSubmitting ? "Submitting..." : "Submit Request to Admin"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Request History */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">My Requests</h2>

                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by product name or platform..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="flex h-10 w-full md:w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="DRAFT">Pending Review</option>
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="REJECTED">Rejected</option>
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
                        <p className="text-gray-500 py-4">Loading your requests...</p>
                    ) : (() => {
                        const filteredRequests = requests.filter(req => {
                            const searchStr = searchTerm.toLowerCase();
                            const matchesSearch =
                                req.product_name.toLowerCase().includes(searchStr) ||
                                req.platform.toLowerCase().includes(searchStr);

                            const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
                            // Assume req.created_at exists. If not, dateFilter won't break heavily, it falls back gracefully
                            const matchesDate = isDateMatch(req.created_at, dateFilter);

                            return matchesSearch && matchesStatus && matchesDate;
                        });

                        if (filteredRequests.length === 0) {
                            return <p className="text-gray-500 py-4">{requests.length === 0 ? "You haven't requested any products yet." : "No requests found matching filters."}</p>;
                        }

                        return filteredRequests.map((req) => (
                            <Card key={req.id} className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <h3 className="font-medium text-lg">{req.product_name}</h3>
                                        <p className="text-sm text-gray-500">{req.platform} • {req.total_slots} orders requested • ₹{req.refund_amount}/review</p>
                                    </div>
                                    <span className={`self-start sm:self-center px-2 py-1 text-xs font-semibold rounded-full ${req.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                                        req.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" :
                                            "bg-gray-100 text-gray-800"
                                        }`}>{req.status === "DRAFT" ? "PENDING REVIEW" : req.status}</span>
                                </div>
                            </Card>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
}

"use client";

import { apiFetch } from "@/lib/apiFetch";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, ShieldAlert } from "lucide-react";

const API_URL = "";

interface Customer {
    id: string;
    name: string;
    mobile: string;
    email: string | null;
    created_at: string;
    _count: {
        orders: number;
        tickets: number;
    }
}

export default function AdminCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: "",
        mobile: "",
        email: "",
        password: ""
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/users/customers?t=${Date.now()}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers);
            }
        } catch (error) {
            console.error("Failed to fetch customers", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        if (id === "mobile") {
            setEditFormData({ ...editFormData, mobile: value.replace(/\D/g, "") });
        } else {
            setEditFormData({ ...editFormData, [id]: value });
        }
    };

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer);
        setEditFormData({
            name: customer.name,
            mobile: customer.mobile,
            email: customer.email || "",
            password: ""
        });
        setError("");
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!editingCustomer) return;
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/users/customer/${editingCustomer.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(editFormData),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to update customer");
                setIsSubmitting(false);
                return;
            }

            toast.success("Customer updated successfully.");
            setEditingCustomer(null);
            fetchCustomers();
        } catch (error) {
            setError("Server error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForceLogout = async (customerId: string) => {
        if (!confirm("Are you sure you want to log this customer out from all devices? They will have to re-enter their password immediately.")) return;
        
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/users/customer/${customerId}/logout`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Customer logged out from all devices.");
            } else {
                toast.error(data.error || "Failed to force logout");
            }
        } catch (error) {
            toast.error("Server error during force logout.");
        }
    };

    return (
        <div className="space-y-8 relative z-10 pb-16">
            <div className="flex items-center justify-between border-b border-border/60 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Manage Customers</h1>
                    <p className="text-muted-foreground mt-1.5 font-sans tracking-wide text-xs sm:text-sm">Review, modify, or secure end-user accounts.</p>
                </div>
            </div>

            <div className="space-y-6 pt-2">
                <div className="relative mb-6">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search customers by name, email, or mobile..."
                        className="pl-10 h-11 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 text-foreground placeholder:text-muted-foreground focus:border-zinc-400 font-sans text-sm rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground font-sans tracking-widest text-xs uppercase animate-pulse">Scanning records...</div>
                ) : customers.length === 0 ? (
                    <Card className="p-12 text-center bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                        <p className="text-muted-foreground font-sans text-sm">No customer records found.</p>
                    </Card>
                ) : (() => {
                    const filteredCustomers = customers.filter(c => {
                        const searchStr = searchTerm.toLowerCase();
                        return c.name.toLowerCase().includes(searchStr) ||
                            (c.email && c.email.toLowerCase().includes(searchStr)) ||
                            c.mobile.includes(searchTerm);
                    });

                    if (filteredCustomers.length === 0) {
                        return <Card className="p-12 text-center bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs"><p className="text-muted-foreground font-sans text-sm">No customers match your criteria.</p></Card>;
                    }

                    return filteredCustomers.map((c) => (
                        editingCustomer?.id === c.id ? (
                            <Card key={c.id} className="p-6 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-400/50 rounded-2xl shadow-xs">
                                <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4">
                                    <h3 className="font-sans font-bold text-lg text-foreground tracking-tight">Update Customer: {c.name}</h3>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs" onClick={() => { setEditingCustomer(null); setError(""); }}>Cancel</Button>
                                </div>
                                {error && editingCustomer?.id === c.id && (
                                    <div className="mb-6 p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/20 font-sans tracking-wide text-center">{error}</div>
                                )}
                                <form onSubmit={handleUpdate} className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-muted-foreground text-xs font-medium">Full Name</Label>
                                        <Input id="name" value={editFormData.name} onChange={handleEditChange} required className="h-10 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mobile" className="text-muted-foreground text-xs font-medium">Direct Line</Label>
                                        <Input id="mobile" className="h-10 rounded-xl" maxLength={10} value={editFormData.mobile} onChange={handleEditChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-muted-foreground text-xs font-medium">Electronic Mail (Optional)</Label>
                                        <Input id="email" type="email" value={editFormData.email} onChange={handleEditChange} className="h-10 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-muted-foreground text-xs font-medium">Reset Passcode (Optional)</Label>
                                        <Input id="password" type="password" placeholder="Leave blank to maintain current" value={editFormData.password} onChange={handleEditChange} minLength={6} className="h-10 rounded-xl" />
                                        {editFormData.password.length > 0 && <p className="text-xs text-muted-foreground mt-1">Note: Resetting password will also force logout all devices.</p>}
                                    </div>
                                    <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-border/40">
                                        <Button type="button" variant="outline" className="rounded-xl text-xs h-10 px-4" onClick={() => { setEditingCustomer(null); setError(""); }}>Cancel</Button>
                                        <Button type="submit" disabled={isSubmitting || !editFormData.name || editFormData.mobile.length !== 10} className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs h-10 px-5 rounded-xl shadow-xs">
                                            {isSubmitting ? "Committing..." : "Commit Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        ) : (
                            <Card key={c.id} className="p-5 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs hover:border-zinc-400/40 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className="font-sans font-bold text-lg text-foreground tracking-tight">{c.name}</h3>
                                    <p className="text-xs font-sans tracking-wide text-muted-foreground mt-1">{c.email || "No email"} • {c.mobile} • Joined {new Date(c.created_at).toLocaleDateString()}</p>
                                    <div className="mt-3 px-3 py-1 max-w-fit rounded-lg bg-muted/60 border border-border text-foreground text-xs flex items-center gap-2">
                                        <span className="text-muted-foreground">Submissions:</span>
                                        <span className="font-mono font-bold">{c._count.orders}</span>
                                        <span className="ml-2 pl-2 border-l border-border text-muted-foreground">Tickets:</span>
                                        <span className="font-mono font-bold">{c._count.tickets}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Button variant="outline" className="h-9 px-3.5 border-border text-foreground/80 hover:text-foreground font-medium text-xs rounded-xl" onClick={() => handleEditClick(c)}>Modify / Reset</Button>
                                    <Button variant="outline" className="h-9 px-3.5 border-zinc-200 dark:border-zinc-800 text-muted-foreground hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/10 font-medium text-xs rounded-xl flex items-center gap-1.5" onClick={() => handleForceLogout(c.id)}>
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        Force Logout
                                    </Button>
                                </div>
                            </Card>
                        )
                    ));
                })()}
            </div>
        </div>
    );
}

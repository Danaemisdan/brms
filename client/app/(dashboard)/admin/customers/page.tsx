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
        <div className="space-y-10 relative z-10">
            <div className="flex items-center justify-between border-b border-border/5 pb-6">
                <div>
                    <h1 className="text-4xl font-sans font-bold text-primary tracking-wider uppercase">Manage Customers</h1>
                    <p className="text-foreground/40 mt-2 font-sans tracking-wide text-sm">Review, modify, or secure end-user accounts.</p>
                </div>
            </div>

            <div className="space-y-6 pt-6">
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
                    <Input
                        placeholder="Search customers by name, email, or mobile..."
                        className="pl-12 h-14 glass-panel border-border/10 text-foreground placeholder:text-foreground/30 focus:border-primary/50 font-sans text-sm tracking-wide"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-primary/70 font-sans tracking-widest text-xs uppercase animate-pulse">Scanning records...</div>
                ) : customers.length === 0 ? (
                    <Card className="p-12 text-center glass-panel border-border/5">
                        <p className="text-foreground/40 font-sans tracking-wide">No customer records found.</p>
                    </Card>
                ) : (() => {
                    const filteredCustomers = customers.filter(c => {
                        const searchStr = searchTerm.toLowerCase();
                        return c.name.toLowerCase().includes(searchStr) ||
                            (c.email && c.email.toLowerCase().includes(searchStr)) ||
                            c.mobile.includes(searchTerm);
                    });

                    if (filteredCustomers.length === 0) {
                        return <Card className="p-12 text-center glass-panel border-border/5"><p className="text-foreground/40 font-sans tracking-wide">No customers match your criteria.</p></Card>;
                    }

                    return filteredCustomers.map((c) => (
                        editingCustomer?.id === c.id ? (
                            <Card key={c.id} className="p-6 glass-panel border-primary/50 shadow-[0_0_30px_rgba(235,87,87,0.1)]">
                                <div className="flex items-center justify-between mb-6 border-b border-border/5 pb-4">
                                    <h3 className="font-sans font-bold text-xl text-primary uppercase tracking-widest">Update Customer: {c.name}</h3>
                                    <Button variant="ghost" size="sm" className="text-foreground/40 hover:text-foreground font-sans tracking-widest uppercase text-[10px]" onClick={() => { setEditingCustomer(null); setError(""); }}>Abort</Button>
                                </div>
                                {error && editingCustomer?.id === c.id && (
                                    <div className="mb-6 p-3 rounded bg-red-900/20 text-red-400 text-xs border border-red-500/50 font-sans tracking-wider uppercase text-center">{error}</div>
                                )}
                                <form onSubmit={handleUpdate} className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <Label htmlFor="name" className="text-foreground/60 uppercase tracking-widest text-[10px]">Full Name</Label>
                                        <Input id="name" value={editFormData.name} onChange={handleEditChange} required className="h-12 bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="mobile" className="text-foreground/60 uppercase tracking-widest text-[10px]">Direct Line</Label>
                                        <Input id="mobile" className="h-12 bg-white/5 border-border/10 text-foreground focus:border-primary/50" maxLength={10} value={editFormData.mobile} onChange={handleEditChange} required />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="email" className="text-foreground/60 uppercase tracking-widest text-[10px]">Electronic Mail (Optional)</Label>
                                        <Input id="email" type="email" value={editFormData.email} onChange={handleEditChange} className="h-12 bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="password" className="text-foreground/60 uppercase tracking-widest text-[10px]">Reset Passcode (Optional)</Label>
                                        <Input id="password" type="password" placeholder="Leave blank to maintain current" value={editFormData.password} onChange={handleEditChange} minLength={6} className="h-12 bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                                        {editFormData.password.length > 0 && <p className="text-xs text-primary/80 mt-1">Note: Resetting password will also force logout all devices.</p>}
                                    </div>
                                    <div className="md:col-span-2 flex justify-end mt-4">
                                        <Button type="submit" disabled={isSubmitting || !editFormData.name || editFormData.mobile.length !== 10} className="w-full bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 font-sans tracking-widest uppercase text-xs h-14 rounded-sm transition-all">
                                            {isSubmitting ? "Committing..." : "Commit Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        ) : (
                            <Card key={c.id} className="p-6 glass-panel border-border/5 hover:border-primary/20 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div>
                                    <h3 className="font-sans font-bold text-xl text-foreground tracking-wide">{c.name}</h3>
                                    <p className="text-xs font-sans tracking-widest text-foreground/40 uppercase mt-2">{c.email || "No email"} • {c.mobile} • Joined {new Date(c.created_at).toLocaleDateString()}</p>
                                    <div className="mt-3 px-3 py-1.5 max-w-fit rounded-sm bg-primary/5 border border-primary/20 text-primary text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        <span>Submissions:</span>
                                        <span className="font-mono font-bold tracking-wider">{c._count.orders}</span>
                                        <span className="ml-3 pl-3 border-l border-primary/20">Tickets:</span>
                                        <span className="font-mono font-bold tracking-wider">{c._count.tickets}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" className="h-9 px-4 border-border/10 text-foreground/70 hover:text-foreground hover:bg-white/5 font-sans tracking-widest uppercase text-[9px] rounded-sm" onClick={() => handleEditClick(c)}>Modify / Reset</Button>
                                    <Button variant="secondary" className="h-9 px-4 bg-red-900/10 text-red-400 hover:bg-red-900/30 border border-red-500/30 font-sans tracking-widest uppercase text-[9px] rounded-sm flex items-center gap-2" onClick={() => handleForceLogout(c.id)}>
                                        <ShieldAlert className="w-3 h-3" />
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

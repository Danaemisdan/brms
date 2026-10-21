"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search } from "lucide-react";

const API_URL = "";

interface Brand {
    id: string;
    name: string;
    mobile: string;
    email: string | null;
    poc_name: string | null;
    website: string | null;
    country: string | null;
    category: string | null;
    products: number;
    status: string;
    wallet_balance: number;
    commission: number;
}

export default function AdminBrands() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        brand_name: "",
        country_code: "+91",
        mobile: "",
        email: "",
        password: "",
        poc_name: "",
        website: "",
        country: "India",
        category: "",
        commission: ""
    });

    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [editFormData, setEditFormData] = useState({
        brand_name: "",
        country_code: "+91",
        mobile: "",
        email: "",
        password: "",
        poc_name: "",
        website: "",
        country: "India",
        category: "",
        commission: ""
    });

    const [walletBrand, setWalletBrand] = useState<Brand | null>(null);
    const [walletData, setWalletData] = useState({
        action: "add",
        amount: ""
    });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/users/brands?t=${Date.now()}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBrands(data.brands);
            }
        } catch (error) {
            console.error("Failed to fetch brands", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        if (id === "mobile") {
            setFormData({ ...formData, [id]: value.replace(/\D/g, "") });
        } else {
            setFormData({ ...formData, [id]: value });
        }
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        // Strip the "edit_" prefix to get the actual field name
        // e.g. id="edit_brand_name" → key="brand_name", id="edit_mobile" → key="mobile"
        const key = id.startsWith("edit_") ? id.slice(5) : id;
        if (key === "mobile") {
            setEditFormData({ ...editFormData, mobile: value.replace(/\D/g, "") });
        } else {
            setEditFormData({ ...editFormData, [key]: value });
        }
    };

    const handleEditClick = (brand: Brand) => {
        setEditingBrand(brand);
        setEditFormData({
            brand_name: brand.name,
            country_code: "+91",
            mobile: brand.mobile,
            email: brand.email || "",
            poc_name: brand.poc_name || "",
            website: brand.website || "",
            country: brand.country || "India",
            category: brand.category || "",
            commission: brand.commission?.toString() || "0",
            password: ""
        });
        setError("");
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!editingBrand) return;
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/users/brand/${editingBrand.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(editFormData),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to update brand");
                setIsSubmitting(false);
                return;
            }

            toast.success("Brand updated successfully.");
            setEditingBrand(null);
            fetchBrands();
        } catch (error) {
            setError("Server error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/users/brand`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to add brand");
                return;
            }

            toast.success("Brand added successfully.");
            setShowForm(false);
            setFormData({ brand_name: "", country_code: "+91", mobile: "", email: "", password: "", poc_name: "", website: "", country: "India", category: "", commission: "" });
            fetchBrands();
        } catch (error) {
            setError("Server error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWalletUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!walletBrand) return;
        setIsSubmitting(true);

        const amountNum = parseFloat(walletData.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError("Please enter a valid positive amount.");
            setIsSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/users/brand/${walletBrand.id}/wallet`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: amountNum,
                    action: walletData.action
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to update wallet");
                setIsSubmitting(false);
                return;
            }

            toast.success(data.message);
            setWalletBrand(null);
            fetchBrands();
        } catch (error) {
            setError("Server error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 relative z-10 pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Manage Vendors</h1>
                    <p className="text-muted-foreground mt-1.5 font-sans tracking-wide text-xs sm:text-sm">Orchestrate and onboard official brand partners.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs tracking-wider uppercase h-11 px-5 rounded-xl transition-all shadow-sm border border-zinc-800 dark:border-zinc-200">
                    {showForm ? "Cancel" : "Add New Brand"}
                </Button>
            </div>

            {showForm && (
                <Card className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                    <CardHeader className="border-b border-border/40 pb-4 mb-4">
                        <CardTitle className="text-lg font-sans font-bold text-foreground tracking-tight">New Brand Partner</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && !editingBrand && (
                            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/20 font-sans tracking-wide text-center">{error}</div>
                        )}
                        <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="brand_name" className="text-muted-foreground text-xs font-medium">Brand / Entity Name</Label>
                                <Input id="brand_name" placeholder="e.g., Tech Accessories Inc" value={formData.brand_name} onChange={handleChange} required className="h-10 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="poc_name" className="text-muted-foreground text-xs font-medium">Liaison (POC) Name</Label>
                                <Input id="poc_name" placeholder="John Doe" value={formData.poc_name} onChange={handleChange} required className="h-10 rounded-xl" />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="mobile" className="text-foreground/60 uppercase tracking-widest text-[10px]">Direct Line</Label>
                                <div className="flex gap-2">
                                    <select
                                        id="country_code"
                                        className="h-12 w-[110px] rounded-sm border border-border/10 bg-foreground/40 px-3 text-foreground text-xs font-sans outline-none focus:border-primary/50"
                                        value={formData.country_code}
                                        onChange={handleChange}
                                    >
                                        <option value="+91">+91 (IN)</option>
                                        <option value="+971">+971 (AE)</option>
                                        <option value="+1">+1 (US)</option>
                                        <option value="+44">+44 (UK)</option>
                                    </select>
                                    <Input id="mobile" className="flex-1 h-12 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans" placeholder="9876543210" maxLength={10} value={formData.mobile} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="email" className="text-foreground/60 uppercase tracking-widest text-[10px]">Electronic Mail</Label>
                                <Input id="email" type="email" placeholder="brand@domain.com" value={formData.email} onChange={handleChange} required className="h-12 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans" />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="website" className="text-foreground/60 uppercase tracking-widest text-[10px]">Digital Presence (Optional)</Label>
                                <Input id="website" type="url" placeholder="https://domain.com" value={formData.website} onChange={handleChange} className="h-12 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans" />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="country" className="text-foreground/60 uppercase tracking-widest text-[10px]">Jurisdiction</Label>
                                <select
                                    id="country"
                                    className="h-12 w-full rounded-sm border border-border/10 bg-foreground/40 px-3 text-foreground text-sm font-sans outline-none focus:border-primary/50"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    required
                                >
                                    <option value="India">India</option>
                                    <option value="UAE">UAE</option>
                                    <option value="USA">USA</option>
                                    <option value="UK">UK</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-foreground/60 uppercase tracking-widest text-[10px]">Sector</Label>
                                <select
                                    className="h-12 w-full rounded-sm border border-border/10 bg-foreground/40 px-3 text-foreground text-sm font-sans outline-none focus:border-primary/50"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Select a sector...</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Fashion">Fashion</option>
                                    <option value="Home & Kitchen">Home & Kitchen</option>
                                    <option value="Health & Beauty">Health & Beauty</option>
                                    <option value="Sports & Outdoors">Sports & Outdoors</option>
                                    <option value="Toys & Games">Toys & Games</option>
                                    <option value="Books">Books</option>
                                    <option value="Automotive">Automotive</option>
                                    <option value="Food & Grocery">Food & Grocery</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="commission" className="text-foreground/60 uppercase tracking-widest text-[10px]">Platform Commission (%)</Label>
                                <Input id="commission" type="number" placeholder="10" value={formData.commission} onChange={handleChange} min="0" step="0.01" required className="h-12 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans" />
                            </div>
                            <div className="space-y-3 md:col-span-2">
                                <Label htmlFor="password" className="text-foreground/60 uppercase tracking-widest text-[10px]">Access Passcode</Label>
                                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={6} className="h-12 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans" />
                            </div>
                            <div className="md:col-span-2 mt-4">
                                <Button type="submit" className="w-full bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 font-sans tracking-widest uppercase text-xs h-14 rounded-sm transition-all" disabled={isSubmitting || !formData.brand_name || !formData.poc_name || formData.mobile.length !== 10 || formData.password.length < 6}>
                                    {isSubmitting ? "Processing..." : "Commit Vendor Record"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6 pt-6">
                {!showForm && (
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
                        <Input
                            placeholder="Search brands by name, contact person, email, or phone..."
                            className="pl-12 h-14 glass-panel border-border/10 text-foreground placeholder:text-foreground/30 focus:border-primary/50 font-sans text-sm tracking-wide"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-12 text-primary/70 font-sans tracking-widest text-xs uppercase animate-pulse">Loading brands...</div>
                ) : brands.length === 0 ? (
                    <Card className="p-12 text-center glass-panel border-border/5">
                        <p className="text-foreground/40 font-sans tracking-wide">No brand records found. Click "Add New Brand" to create one.</p>
                    </Card>
                ) : (() => {
                    const filteredBrands = brands.filter(v => {
                        const searchStr = searchTerm.toLowerCase();
                        return v.name.toLowerCase().includes(searchStr) ||
                            (v.poc_name && v.poc_name.toLowerCase().includes(searchStr)) ||
                            (v.email && v.email.toLowerCase().includes(searchStr)) ||
                            v.mobile.includes(searchTerm);
                    });

                    if (filteredBrands.length === 0) {
                        return <Card className="p-12 text-center glass-panel border-border/5"><p className="text-foreground/40 font-sans tracking-wide">No brands match your search criteria.</p></Card>;
                    }

                    return (
                        <>
                            <div className="space-y-6">
                                {filteredBrands.map((v) => (
                                    editingBrand?.id === v.id ? (
                            <Card key={v.id} className="p-6 glass-panel border-primary/50 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                                <div className="flex items-center justify-between mb-6 border-b border-border/5 pb-4">
                                    <h3 className="font-sans font-bold text-xl text-primary uppercase tracking-widest">Edit Brand: {v.name}</h3>
                                    <Button variant="ghost" size="sm" className="text-foreground/40 hover:text-foreground font-sans tracking-widest uppercase text-[10px]" onClick={() => { setEditingBrand(null); setError(""); }}>Cancel</Button>
                                </div>
                                {error && editingBrand?.id === v.id && (
                                    <div className="mb-6 p-3 rounded bg-red-900/20 text-red-400 text-xs border border-red-500/50 font-sans tracking-wider uppercase text-center">{error}</div>
                                )}
                                <form onSubmit={handleUpdate} className="grid gap-6 md:grid-cols-2">
                                    {/* Same fields but styled */}
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_brand_name" className="text-foreground/60 uppercase tracking-widest text-[10px]">Brand Name</Label>
                                        <Input id="edit_brand_name" value={editFormData.brand_name} onChange={handleEditChange} required className="h-12 bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_poc_name" className="text-foreground/60 uppercase tracking-widest text-[10px]">Liaison Name</Label>
                                        <Input id="edit_poc_name" value={editFormData.poc_name} onChange={handleEditChange} required className="h-12 bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_mobile" className="text-foreground/60 uppercase tracking-widest text-[10px]">Direct Line</Label>
                                        <div className="flex gap-2">
                                            <select
                                                id="edit_country_code"
                                                className="h-12 w-[110px] rounded-sm border border-border/10 bg-foreground/40 px-3 text-foreground text-xs outline-none focus:border-primary/50"
                                                value={editFormData.country_code}
                                                onChange={(e) => setEditFormData({ ...editFormData, country_code: e.target.value })}
                                            >
                                                <option value="+91">+91 (IN)</option>
                                                <option value="+971">+971 (AE)</option>
                                                <option value="+1">+1 (US)</option>
                                                <option value="+44">+44 (UK)</option>
                                            </select>
                                            <Input id="edit_mobile" className="flex-1 h-12 bg-white/5 border-border/10 text-foreground focus:border-primary/50" maxLength={10} value={editFormData.mobile} onChange={handleEditChange} required />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_email" className="text-foreground/60 uppercase tracking-widest text-[10px]">Electronic Mail</Label>
                                        <Input id="edit_email" type="email" value={editFormData.email} onChange={handleEditChange} required className="h-12 bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_website" className="text-foreground/60 uppercase tracking-widest text-[10px]">Digital Presence (Optional)</Label>
                                        <Input id="edit_website" type="url" value={editFormData.website} onChange={handleEditChange} className="h-12 bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_country" className="text-foreground/60 uppercase tracking-widest text-[10px]">Jurisdiction</Label>
                                        <select
                                            id="edit_country"
                                            className="h-12 w-full rounded-sm border border-border/10 bg-foreground/40 px-3 text-foreground text-sm outline-none focus:border-primary/50"
                                            value={editFormData.country}
                                            onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                                            required
                                        >
                                            <option value="India">India</option>
                                            <option value="UAE">UAE</option>
                                            <option value="USA">USA</option>
                                            <option value="UK">UK</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-foreground/60 uppercase tracking-widest text-[10px]">Sector</Label>
                                        <select
                                            className="h-12 w-full rounded-sm border border-border/10 bg-foreground/40 px-3 text-foreground text-sm outline-none focus:border-primary/50"
                                            value={editFormData.category}
                                            onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                        >
                                            <option value="">Select a sector...</option>
                                            <option value="Electronics">Electronics</option>
                                            <option value="Fashion">Fashion</option>
                                            <option value="Home & Kitchen">Home & Kitchen</option>
                                            <option value="Health & Beauty">Health & Beauty</option>
                                            <option value="Sports & Outdoors">Sports & Outdoors</option>
                                            <option value="Toys & Games">Toys & Games</option>
                                            <option value="Books">Books</option>
                                            <option value="Automotive">Automotive</option>
                                            <option value="Food & Grocery">Food & Grocery</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_commission" className="text-foreground/60 uppercase tracking-widest text-[10px]">Platform Commission (%)</Label>
                                        <Input id="edit_commission" type="number" value={editFormData.commission} onChange={handleEditChange} min="0" step="0.01" required className="h-12 bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <Label htmlFor="edit_password" className="text-foreground/60 uppercase tracking-widest text-[10px]">New Passcode (Optional)</Label>
                                        <Input id="edit_password" type="password" placeholder="Leave blank to maintain current" value={editFormData.password} onChange={handleEditChange} minLength={6} className="h-12 bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                                    </div>
                                    <div className="md:col-span-2 flex justify-end mt-4">
                                        <Button type="submit" disabled={isSubmitting || !editFormData.brand_name || editFormData.mobile.length !== 10} className="w-full bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 font-sans tracking-widest uppercase text-xs h-14 rounded-sm transition-all">
                                            {isSubmitting ? "Committing..." : "Commit Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        ) : walletBrand?.id === v.id ? (
                            <Card key={`wallet-${v.id}`} className="p-6 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                                <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4">
                                    <h3 className="font-sans font-bold text-lg text-foreground tracking-tight">Treasury: {v.name}</h3>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs" onClick={() => { setWalletBrand(null); setError(""); }}>Cancel</Button>
                                </div>
                                <div className="mb-6 bg-muted/40 border border-border/60 p-4 rounded-xl flex justify-between items-center">
                                    <span className="text-muted-foreground font-sans text-xs uppercase tracking-wider">Current Reserves:</span>
                                    <span className="text-2xl text-foreground font-mono font-bold tracking-tight">₹{v.wallet_balance?.toLocaleString() || 0}</span>
                                </div>
                                {error && walletBrand?.id === v.id && (
                                    <div className="mb-6 p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/20 font-sans tracking-wide text-center">{error}</div>
                                )}
                                <form onSubmit={handleWalletUpdate} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="action" className="text-muted-foreground text-xs font-medium">Operation</Label>
                                        <select
                                            id="action"
                                            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-foreground text-xs outline-none focus:border-zinc-400"
                                            value={walletData.action}
                                            onChange={(e) => setWalletData({ ...walletData, action: e.target.value })}
                                        >
                                            <option value="add">Deposit Funds (+)</option>
                                            <option value="remove">Withdraw Funds (-)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount" className="text-muted-foreground text-xs font-medium">Capital (₹)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            min="1"
                                            placeholder="5000"
                                            value={walletData.amount}
                                            onChange={(e) => setWalletData({ ...walletData, amount: e.target.value })}
                                            required
                                            className="h-10 rounded-xl"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button type="submit" className={`w-full h-10 font-medium text-xs rounded-xl shadow-xs transition-all ${walletData.action === 'add' ? 'bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`} disabled={isSubmitting || !walletData.amount}>
                                            {isSubmitting ? "Executing..." : walletData.action === 'add' ? "Execute Deposit" : "Execute Withdrawal"}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        ) : (
                            <Card key={v.id} className="p-5 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs hover:border-zinc-400/40 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className="font-sans font-bold text-lg text-foreground tracking-tight">{v.name}</h3>
                                    <p className="text-xs font-sans tracking-wide text-muted-foreground mt-1">{v.email || "No email"} • {v.mobile} • {v.products} Campaigns{v.category ? ` • ${v.category}` : ""}</p>
                                    <div className="mt-3 px-3 py-1 max-w-fit rounded-lg bg-muted/60 border border-border text-foreground text-xs flex items-center gap-2">
                                        <span className="text-muted-foreground">Treasury:</span>
                                        <span className="font-mono font-bold">₹{v.wallet_balance?.toLocaleString() || 0}</span>
                                        <span className="ml-2 pl-2 border-l border-border text-muted-foreground">Commission:</span>
                                        <span className="font-mono font-bold">{v.commission || 0}%</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className={`px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full border ${v.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}>
                                        {v.status || "Active"}
                                    </span>
                                    <Button variant="outline" className="h-9 px-3.5 border-border text-foreground/80 hover:text-foreground font-medium text-xs rounded-xl" onClick={() => handleEditClick(v)}>Modify</Button>
                                    <Button variant="outline" className="h-9 px-3.5 border-border text-foreground/80 hover:text-foreground font-medium text-xs rounded-xl" onClick={() => { setWalletBrand(v); setError(""); setWalletData({ action: 'add', amount: '' }); }}>Treasury</Button>
                                </div>
                            </Card>
                        )
                                ))}
                            </div>
                            <div className="mt-8 p-6 bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl flex flex-col md:flex-row items-center justify-between shadow-xs">
                                <div>
                                    <h3 className="font-sans font-bold text-lg text-foreground tracking-tight">Global Treasury Reserves</h3>
                                    <p className="text-muted-foreground font-sans text-xs mt-0.5">Aggregated capital across all active brand wallets.</p>
                                </div>
                                <div className="mt-4 md:mt-0 text-3xl text-foreground font-mono font-bold tracking-tight">
                                    ₹{brands.reduce((sum, b) => sum + (b.wallet_balance || 0), 0).toLocaleString()}
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
    );
}

"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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
            const res = await apiFetch(`${API_URL}/api/users/brands`, {
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
                body: JSON.stringify({ ...formData, mobile: `${formData.country_code}${formData.mobile}` }),
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
        <div className="space-y-10 relative z-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-4xl font-heading text-[#d4af37] tracking-wider uppercase">Manage Vendors</h1>
                    <p className="text-white/40 mt-2 font-sans tracking-wide text-sm">Orchestrate and onboard official brand partners.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37]/20 font-sans tracking-widest uppercase text-xs h-12 px-6 rounded-sm transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                    {showForm ? "Cancel Operation" : "Authorize New Vendor"}
                </Button>
            </div>

            {showForm && (
                <Card className="glass-panel border-[#d4af37]/30 shadow-[0_0_30px_rgba(212,175,55,0.05)]">
                    <CardHeader className="border-b border-white/5 pb-4 mb-4">
                        <CardTitle className="text-xl font-heading text-white tracking-widest uppercase">New Vendor Dossier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && !editingBrand && (
                            <div className="mb-6 p-3 rounded bg-red-900/20 text-red-400 text-xs border border-red-500/50 font-sans tracking-wider uppercase text-center">{error}</div>
                        )}
                        <form onSubmit={handleAdd} className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-3">
                                <Label htmlFor="brand_name" className="text-white/60 uppercase tracking-widest text-[10px]">Brand / Entity Name</Label>
                                <Input id="brand_name" placeholder="e.g., Tech Accessories Inc" value={formData.brand_name} onChange={handleChange} required className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#d4af37]/50 font-sans" />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="poc_name" className="text-white/60 uppercase tracking-widest text-[10px]">Liaison (POC) Name</Label>
                                <Input id="poc_name" placeholder="John Doe" value={formData.poc_name} onChange={handleChange} required className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#d4af37]/50 font-sans" />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="mobile" className="text-white/60 uppercase tracking-widest text-[10px]">Direct Line</Label>
                                <div className="flex gap-2">
                                    <select
                                        id="country_code"
                                        className="h-12 w-[110px] rounded-sm border border-white/10 bg-black/40 px-3 text-white text-xs font-sans outline-none focus:border-[#d4af37]/50"
                                        value={formData.country_code}
                                        onChange={handleChange}
                                    >
                                        <option value="+91">+91 (IN)</option>
                                        <option value="+971">+971 (AE)</option>
                                        <option value="+1">+1 (US)</option>
                                        <option value="+44">+44 (UK)</option>
                                    </select>
                                    <Input id="mobile" className="flex-1 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#d4af37]/50 font-sans" placeholder="9876543210" maxLength={10} value={formData.mobile} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="email" className="text-white/60 uppercase tracking-widest text-[10px]">Electronic Mail</Label>
                                <Input id="email" type="email" placeholder="brand@domain.com" value={formData.email} onChange={handleChange} required className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#d4af37]/50 font-sans" />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="website" className="text-white/60 uppercase tracking-widest text-[10px]">Digital Presence (Optional)</Label>
                                <Input id="website" type="url" placeholder="https://domain.com" value={formData.website} onChange={handleChange} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#d4af37]/50 font-sans" />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="country" className="text-white/60 uppercase tracking-widest text-[10px]">Jurisdiction</Label>
                                <select
                                    id="country"
                                    className="h-12 w-full rounded-sm border border-white/10 bg-black/40 px-3 text-white text-sm font-sans outline-none focus:border-[#d4af37]/50"
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
                                <Label className="text-white/60 uppercase tracking-widest text-[10px]">Sector</Label>
                                <select
                                    className="h-12 w-full rounded-sm border border-white/10 bg-black/40 px-3 text-white text-sm font-sans outline-none focus:border-[#d4af37]/50"
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
                                <Label htmlFor="commission" className="text-white/60 uppercase tracking-widest text-[10px]">Platform Commission (%)</Label>
                                <Input id="commission" type="number" placeholder="10" value={formData.commission} onChange={handleChange} min="0" step="0.01" required className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#d4af37]/50 font-sans" />
                            </div>
                            <div className="space-y-3 md:col-span-2">
                                <Label htmlFor="password" className="text-white/60 uppercase tracking-widest text-[10px]">Access Passcode</Label>
                                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={6} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#d4af37]/50 font-sans" />
                            </div>
                            <div className="md:col-span-2 mt-4">
                                <Button type="submit" className="w-full bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37]/20 font-sans tracking-widest uppercase text-xs h-14 rounded-sm transition-all" disabled={isSubmitting || !formData.brand_name || !formData.poc_name || formData.mobile.length !== 10 || formData.password.length < 6}>
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
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                        <Input
                            placeholder="Search dossier by name, liaison, email, or direct line..."
                            className="pl-12 h-14 glass-panel border-white/10 text-white placeholder:text-white/30 focus:border-[#d4af37]/50 font-sans text-sm tracking-wide"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-12 text-[#d4af37]/70 font-sans tracking-widest text-xs uppercase animate-pulse">Scanning records...</div>
                ) : brands.length === 0 ? (
                    <Card className="p-12 text-center glass-panel border-white/5">
                        <p className="text-white/40 font-sans tracking-wide">No vendor records established. Initialize "Authorize New Vendor" to proceed.</p>
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
                        return <Card className="p-12 text-center glass-panel border-white/5"><p className="text-white/40 font-sans tracking-wide">No dossiers match your criteria.</p></Card>;
                    }

                    return filteredBrands.map((v) => (
                        editingBrand?.id === v.id ? (
                            <Card key={v.id} className="p-6 glass-panel border-[#d4af37]/50 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                    <h3 className="font-heading text-xl text-[#d4af37] uppercase tracking-widest">Update Dossier: {v.name}</h3>
                                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white font-sans tracking-widest uppercase text-[10px]" onClick={() => { setEditingBrand(null); setError(""); }}>Abort</Button>
                                </div>
                                {error && editingBrand?.id === v.id && (
                                    <div className="mb-6 p-3 rounded bg-red-900/20 text-red-400 text-xs border border-red-500/50 font-sans tracking-wider uppercase text-center">{error}</div>
                                )}
                                <form onSubmit={handleUpdate} className="grid gap-6 md:grid-cols-2">
                                    {/* Same fields but styled */}
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_brand_name" className="text-white/60 uppercase tracking-widest text-[10px]">Brand Name</Label>
                                        <Input id="edit_brand_name" value={editFormData.brand_name} onChange={handleEditChange} required className="h-12 bg-white/5 border-white/10 text-white focus:border-[#d4af37]/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_poc_name" className="text-white/60 uppercase tracking-widest text-[10px]">Liaison Name</Label>
                                        <Input id="edit_poc_name" value={editFormData.poc_name} onChange={handleEditChange} required className="h-12 bg-white/5 border-white/10 text-white focus:border-[#d4af37]/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_mobile" className="text-white/60 uppercase tracking-widest text-[10px]">Direct Line</Label>
                                        <div className="flex gap-2">
                                            <select
                                                id="edit_country_code"
                                                className="h-12 w-[110px] rounded-sm border border-white/10 bg-black/40 px-3 text-white text-xs outline-none focus:border-[#d4af37]/50"
                                                value={editFormData.country_code}
                                                onChange={(e) => setEditFormData({ ...editFormData, country_code: e.target.value })}
                                            >
                                                <option value="+91">+91 (IN)</option>
                                                <option value="+971">+971 (AE)</option>
                                                <option value="+1">+1 (US)</option>
                                                <option value="+44">+44 (UK)</option>
                                            </select>
                                            <Input id="edit_mobile" className="flex-1 h-12 bg-white/5 border-white/10 text-white focus:border-[#d4af37]/50" maxLength={10} value={editFormData.mobile} onChange={handleEditChange} required />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_email" className="text-white/60 uppercase tracking-widest text-[10px]">Electronic Mail</Label>
                                        <Input id="edit_email" type="email" value={editFormData.email} onChange={handleEditChange} required className="h-12 bg-white/5 border-white/10 text-white focus:border-[#d4af37]/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_website" className="text-white/60 uppercase tracking-widest text-[10px]">Digital Presence (Optional)</Label>
                                        <Input id="edit_website" type="url" value={editFormData.website} onChange={handleEditChange} className="h-12 bg-white/5 border-white/10 text-white focus:border-[#d4af37]/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="edit_country" className="text-white/60 uppercase tracking-widest text-[10px]">Jurisdiction</Label>
                                        <select
                                            id="edit_country"
                                            className="h-12 w-full rounded-sm border border-white/10 bg-black/40 px-3 text-white text-sm outline-none focus:border-[#d4af37]/50"
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
                                        <Label className="text-white/60 uppercase tracking-widest text-[10px]">Sector</Label>
                                        <select
                                            className="h-12 w-full rounded-sm border border-white/10 bg-black/40 px-3 text-white text-sm outline-none focus:border-[#d4af37]/50"
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
                                        <Label htmlFor="edit_commission" className="text-white/60 uppercase tracking-widest text-[10px]">Platform Commission (%)</Label>
                                        <Input id="edit_commission" type="number" value={editFormData.commission} onChange={handleEditChange} min="0" step="0.01" required className="h-12 bg-white/5 border-white/10 text-white focus:border-[#d4af37]/50" />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <Label htmlFor="edit_password" className="text-white/60 uppercase tracking-widest text-[10px]">New Passcode (Optional)</Label>
                                        <Input id="edit_password" type="password" placeholder="Leave blank to maintain current" value={editFormData.password} onChange={handleEditChange} minLength={6} className="h-12 bg-white/5 border-white/10 text-white focus:border-[#d4af37]/50" />
                                    </div>
                                    <div className="md:col-span-2 flex justify-end mt-4">
                                        <Button type="submit" disabled={isSubmitting || !editFormData.brand_name || editFormData.mobile.length !== 10} className="w-full bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37]/20 font-sans tracking-widest uppercase text-xs h-14 rounded-sm transition-all">
                                            {isSubmitting ? "Committing..." : "Commit Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        ) : walletBrand?.id === v.id ? (
                            <Card key={`wallet-${v.id}`} className="p-6 glass-panel border-[#8a7322]/50 shadow-[0_0_30px_rgba(138,115,34,0.1)]">
                                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                    <h3 className="font-heading text-xl text-[#d4af37] uppercase tracking-widest">Treasury: {v.name}</h3>
                                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white font-sans tracking-widest uppercase text-[10px]" onClick={() => { setWalletBrand(null); setError(""); }}>Abort</Button>
                                </div>
                                <div className="mb-6 bg-black/40 border border-white/5 p-5 rounded-sm flex justify-between items-center">
                                    <span className="text-white/50 font-sans tracking-widest text-[10px] uppercase">Current Reserves:</span>
                                    <span className="text-2xl text-[#d4af37] font-mono tracking-wider">₹{v.wallet_balance?.toLocaleString() || 0}</span>
                                </div>
                                {error && walletBrand?.id === v.id && (
                                    <div className="mb-6 p-3 rounded bg-red-900/20 text-red-400 text-xs border border-red-500/50 font-sans tracking-wider uppercase text-center">{error}</div>
                                )}
                                <form onSubmit={handleWalletUpdate} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="space-y-3">
                                        <Label htmlFor="action" className="text-white/60 uppercase tracking-widest text-[10px]">Operation</Label>
                                        <select
                                            id="action"
                                            className="h-12 w-full rounded-sm border border-white/10 bg-black/40 px-3 text-white text-xs outline-none focus:border-[#d4af37]/50"
                                            value={walletData.action}
                                            onChange={(e) => setWalletData({ ...walletData, action: e.target.value })}
                                        >
                                            <option value="add">Deposit Funds (+)</option>
                                            <option value="remove">Withdraw Funds (-)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="amount" className="text-white/60 uppercase tracking-widest text-[10px]">Capital (₹)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            min="1"
                                            placeholder="5000"
                                            value={walletData.amount}
                                            onChange={(e) => setWalletData({ ...walletData, amount: e.target.value })}
                                            required
                                            className="h-12 bg-white/5 border-white/10 text-white focus:border-[#d4af37]/50"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button type="submit" className={`w-full h-12 font-sans tracking-widest uppercase text-[10px] rounded-sm transition-all ${walletData.action === 'add' ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37]/20' : 'bg-red-900/20 text-red-400 border border-red-500/50 hover:bg-red-900/40'}`} disabled={isSubmitting || !walletData.amount}>
                                            {isSubmitting ? "Executing..." : walletData.action === 'add' ? "Execute Deposit" : "Execute Withdrawal"}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        ) : (
                            <Card key={v.id} className="p-6 glass-panel border-white/5 hover:border-[#d4af37]/20 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div>
                                    <h3 className="font-heading text-xl text-white tracking-wide">{v.name}</h3>
                                    <p className="text-xs font-sans tracking-widest text-white/40 uppercase mt-2">{v.email || "No email"} • {v.mobile} • {v.products} Campaigns{v.category ? ` • ${v.category}` : ""}</p>
                                    <div className="mt-3 px-3 py-1.5 max-w-fit rounded-sm bg-[#d4af37]/5 border border-[#d4af37]/20 text-[#d4af37] text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        <span>Treasury:</span>
                                        <span className="font-mono font-bold tracking-wider">₹{v.wallet_balance?.toLocaleString() || 0}</span>
                                        <span className="ml-3 pl-3 border-l border-[#d4af37]/20">Tax:</span>
                                        <span className="font-mono font-bold tracking-wider">{v.commission || 0}%</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 text-[9px] uppercase tracking-widest rounded-sm ${v.status === 'active' ? 'bg-white/10 text-white' : 'bg-red-900/20 text-red-400'}`}>
                                        {v.status || "Active"}
                                    </span>
                                    <Button variant="outline" className="h-9 px-4 border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-sans tracking-widest uppercase text-[9px] rounded-sm" onClick={() => handleEditClick(v)}>Modify</Button>
                                    <Button variant="secondary" className="h-9 px-4 bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20 border border-[#d4af37]/30 font-sans tracking-widest uppercase text-[9px] rounded-sm" onClick={() => { setWalletBrand(v); setError(""); setWalletData({ action: 'add', amount: '' }); }}>Treasury</Button>
                                </div>
                            </Card>
                        )
                    ));
                })()}
            </div>
        </div>
    );
}

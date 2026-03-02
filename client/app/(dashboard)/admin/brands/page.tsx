"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface Brand {
    id: string;
    name: string;
    mobile: string;
    email: string | null;
    poc_name: string | null;
    website: string | null;
    country: string | null;
    products: number;
    status: string;
}

export default function AdminBrands() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        brand_name: "",
        country_code: "+91",
        mobile: "",
        email: "",
        password: "",
        poc_name: "",
        website: "",
        country: "India"
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
        country: "India"
    });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/users/brands`, {
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
        if (id === "edit_mobile") {
            setEditFormData({ ...editFormData, mobile: value.replace(/\D/g, "") });
        } else if (id === "edit_brand_name") {
            setEditFormData({ ...editFormData, brand_name: value });
        } else if (id === "edit_email") {
            setEditFormData({ ...editFormData, email: value });
        } else if (id === "edit_password") {
            setEditFormData({ ...editFormData, password: value });
        } else if (id === "edit_poc_name") {
            setEditFormData({ ...editFormData, poc_name: value });
        } else if (id === "edit_website") {
            setEditFormData({ ...editFormData, website: value });
        } else if (id === "edit_country") {
            setEditFormData({ ...editFormData, country: value });
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
            password: "" // Keep empty, only send if they type a new one
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
            const res = await fetch(`${API_URL}/api/users/brand/${editingBrand.id}`, {
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
            const res = await fetch(`${API_URL}/api/users/brand`, {
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
            setFormData({ brand_name: "", country_code: "+91", mobile: "", email: "", password: "", poc_name: "", website: "", country: "India" });
            fetchBrands();
        } catch (error) {
            setError("Server error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Brands</h1>
                    <p className="text-gray-500">Add and manage brand accounts.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Add New Brand"}</Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader><CardTitle>New Brand</CardTitle></CardHeader>
                    <CardContent>
                        {error && !editingBrand && (
                            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>
                        )}
                        <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="brand_name">Brand / Company Name</Label>
                                <Input id="brand_name" placeholder="e.g., Tech Accessories Inc" value={formData.brand_name} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="poc_name">Point of Contact (POC) Name</Label>
                                <Input id="poc_name" placeholder="John Doe" value={formData.poc_name} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobile">Contact Mobile</Label>
                                <div className="flex gap-2">
                                    <select
                                        id="country_code"
                                        className="h-10 w-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={formData.country_code}
                                        onChange={handleChange}
                                    >
                                        <option value="+91">+91 (IN)</option>
                                        <option value="+971">+971 (AE)</option>
                                        <option value="+1">+1 (US)</option>
                                        <option value="+44">+44 (UK)</option>
                                    </select>
                                    <Input id="mobile" className="flex-1" placeholder="9876543210" maxLength={10} value={formData.mobile} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="brand@example.com" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website Link (Optional)</Label>
                                <Input id="website" type="url" placeholder="https://example.com" value={formData.website} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <select
                                    id="country"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                            <div className="space-y-2">
                                <Label htmlFor="password">Password (for brand login)</Label>
                                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={6} />
                            </div>
                            <div className="md:col-span-2">
                                <Button type="submit" className="w-full" disabled={isSubmitting || !formData.brand_name || !formData.poc_name || formData.mobile.length !== 10 || formData.password.length < 6}>
                                    {isSubmitting ? "Adding..." : "Add Brand"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading brands...</div>
                ) : brands.length === 0 ? (
                    <Card className="p-8 text-center text-gray-500">
                        No brands added yet. Click "Add New Brand" to get started.
                    </Card>
                ) : (
                    brands.map((v) => (
                        editingBrand?.id === v.id ? (
                            <Card key={v.id} className="p-6 border-blue-500 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-lg">Edit Brand: {v.name}</h3>
                                    <Button variant="ghost" size="sm" onClick={() => { setEditingBrand(null); setError(""); }}>Cancel</Button>
                                </div>
                                {error && editingBrand?.id === v.id && (
                                    <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>
                                )}
                                <form onSubmit={handleUpdate} className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_brand_name">Brand Name</Label>
                                        <Input id="edit_brand_name" value={editFormData.brand_name} onChange={handleEditChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_poc_name">POC Name</Label>
                                        <Input id="edit_poc_name" value={editFormData.poc_name} onChange={handleEditChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_mobile">Mobile</Label>
                                        <div className="flex gap-2">
                                            <select
                                                id="edit_country_code"
                                                className="h-10 w-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                value={editFormData.country_code}
                                                onChange={(e) => setEditFormData({ ...editFormData, country_code: e.target.value })}
                                            >
                                                <option value="+91">+91 (IN)</option>
                                                <option value="+971">+971 (AE)</option>
                                                <option value="+1">+1 (US)</option>
                                                <option value="+44">+44 (UK)</option>
                                            </select>
                                            <Input id="edit_mobile" className="flex-1" maxLength={10} value={editFormData.mobile} onChange={handleEditChange} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_email">Email</Label>
                                        <Input id="edit_email" type="email" value={editFormData.email} onChange={handleEditChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_website">Website Link (Optional)</Label>
                                        <Input id="edit_website" type="url" value={editFormData.website} onChange={handleEditChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_country">Country</Label>
                                        <select
                                            id="edit_country"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_password">New Password (Optional)</Label>
                                        <Input id="edit_password" type="password" placeholder="Leave blank to keep current" value={editFormData.password} onChange={handleEditChange} minLength={6} />
                                    </div>
                                    <div className="md:col-span-2 flex justify-end">
                                        <Button type="submit" disabled={isSubmitting || !editFormData.brand_name || editFormData.mobile.length !== 10}>
                                            {isSubmitting ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        ) : (
                            <Card key={v.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{v.name}</h3>
                                    <p className="text-sm text-gray-500">{v.email || "No email"} • {v.mobile} • {v.products} products listed</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${v.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {v.status || "Active"}
                                    </span>
                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(v)}>Edit</Button>
                                </div>
                            </Card>
                        )
                    ))
                )}
            </div>
        </div>
    );
}

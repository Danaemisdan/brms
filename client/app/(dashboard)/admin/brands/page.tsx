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
        mobile: "",
        email: "",
        password: ""
    });

    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [editFormData, setEditFormData] = useState({
        brand_name: "",
        mobile: "",
        email: "",
        password: ""
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        if (id === "mobile") {
            setFormData({ ...formData, [id]: value.replace(/\D/g, "") });
        } else {
            setFormData({ ...formData, [id]: value });
        }
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        if (id === "edit_mobile") {
            setEditFormData({ ...editFormData, mobile: value.replace(/\D/g, "") });
        } else if (id === "edit_brand_name") {
            setEditFormData({ ...editFormData, brand_name: value });
        } else if (id === "edit_email") {
            setEditFormData({ ...editFormData, email: value });
        } else if (id === "edit_password") {
            setEditFormData({ ...editFormData, password: value });
        }
    };

    const handleEditClick = (brand: Brand) => {
        setEditingBrand(brand);
        setEditFormData({
            brand_name: brand.name,
            mobile: brand.mobile,
            email: brand.email || "",
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
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to add brand");
                return;
            }

            toast.success("Brand added successfully.");
            setShowForm(false);
            setFormData({ brand_name: "", mobile: "", email: "", password: "" });
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
                                <Label htmlFor="mobile">Contact Mobile</Label>
                                <Input id="mobile" placeholder="9876543210" maxLength={10} value={formData.mobile} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="brand@example.com" value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password (for brand login)</Label>
                                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={6} />
                            </div>
                            <div className="md:col-span-2">
                                <Button type="submit" className="w-full" disabled={isSubmitting || !formData.brand_name || formData.mobile.length !== 10 || formData.password.length < 6}>
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
                                        <Label htmlFor="edit_mobile">Mobile</Label>
                                        <Input id="edit_mobile" maxLength={10} value={editFormData.mobile} onChange={handleEditChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_email">Email</Label>
                                        <Input id="edit_email" type="email" value={editFormData.email} onChange={handleEditChange} />
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

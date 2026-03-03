"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MultiImageDropzone } from "@/components/ui/multi-image-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function AdminProducts() {
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [form, setForm] = useState({
        product_name: "",
        product_link: "",
        platform: "AMAZON",
        refund_amount: "",
        deadline: "",
        total_slots: "",
        is_public: true, // Defaults to public
        wa_target: "all_customers",
        wa_custom_phones: "",
        wa_template: "🚀 *New Premium Freebie Alert!*\n\nGet the *{{product_name}}* absolutely FREE after cashback!\n\n🛒 Platform: {{platform}}\n💰 Refund Amount: ₹{{refund_amount}}\n\nHurry, only {{available_slots}} slots left!\n\n👉 *Claim deal here:* {{product_link}}",
        wa_schedule_frequency: "NONE",
        wa_schedule_days: ""
    });

    // WhatsApp Campaign State
    const [isWaModalOpen, setIsWaModalOpen] = useState(false);
    const [selectedWaProduct, setSelectedWaProduct] = useState<any>(null);
    const [waTemplate, setWaTemplate] = useState(
        "🚀 *New Premium Freebie Alert!*\n\nGet the *{{product_name}}* absolutely FREE after cashback!\n\n🛒 Platform: {{platform}}\n💰 Refund Amount: ₹{{refund_amount}}\n\nHurry, only {{available_slots}} slots left!\n\n👉 *Claim deal here:* {{product_link}}"
    );
    const [waTarget, setWaTarget] = useState("all_customers");
    const [customPhones, setCustomPhones] = useState("");
    const [isSendingWa, setIsSendingWa] = useState(false);
    const [waScheduledAt, setWaScheduledAt] = useState("");

    // Image Upload State
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/products?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    const handleImageChange = (files: File[]) => {
        const availableSlots = Math.max(0, 6 - existingImages.length);
        const newFiles = [...imageFiles, ...files].slice(0, availableSlots);
        setImageFiles(newFiles);

        imagePreviews.forEach(p => URL.revokeObjectURL(p));
        setImagePreviews(newFiles.map(file => URL.createObjectURL(file)));
    };

    const removeExistingImage = (index: number) => {
        const newImages = [...existingImages];
        newImages.splice(index, 1);
        setExistingImages(newImages);
    };

    const removeNewImage = (index: number) => {
        const newFiles = [...imageFiles];
        newFiles.splice(index, 1);
        setImageFiles(newFiles);

        const newPreviews = [...imagePreviews];
        if (newPreviews[index]) {
            URL.revokeObjectURL(newPreviews[index]);
        }
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            product_name: "", product_link: "", platform: "AMAZON", refund_amount: "", deadline: "", total_slots: "", is_public: true,
            wa_target: "all_customers", wa_custom_phones: "", wa_template: "🚀 *New Premium Freebie Alert!*\n\nGet the *{{product_name}}* absolutely FREE after cashback!\n\n🛒 Platform: {{platform}}\n💰 Refund Amount: ₹{{refund_amount}}\n\nHurry, only {{available_slots}} slots left!\n\n👉 *Claim deal here:* {{product_link}}",
            wa_schedule_frequency: "NONE", wa_schedule_days: ""
        });
        setExistingImages([]);
        setImageFiles([]);
        setImagePreviews([]);
        setShowForm(false);
    };

    const handleEditClick = (product: any) => {
        setEditingId(product.id);
        setForm({
            product_name: product.product_name,
            product_link: product.product_link,
            platform: product.platform,
            refund_amount: String(product.refund_amount),
            deadline: product.deadline ? new Date(product.deadline).toISOString().split('T')[0] : "",
            total_slots: String(product.total_slots),
            is_public: product.is_public !== false, // defaults to true
            wa_target: product.wa_target || "all_customers",
            wa_custom_phones: product.wa_custom_phones || "",
            wa_template: product.wa_template || "🚀 *New Premium Freebie Alert!*\n\nGet the *{{product_name}}* absolutely FREE after cashback!\n\n🛒 Platform: {{platform}}\n💰 Refund Amount: ₹{{refund_amount}}\n\nHurry, only {{available_slots}} slots left!\n\n👉 *Claim deal here:* {{product_link}}",
            wa_schedule_frequency: product.wa_schedule_frequency || "NONE",
            wa_schedule_days: product.wa_schedule_days || ""
        });
        setImageFiles([]);
        setImagePreviews([]);
        try {
            const parsed = JSON.parse(product.product_image);
            const imgs = Array.isArray(parsed) ? parsed : [parsed];
            setExistingImages(imgs.map(img => img.startsWith('/') ? `${API_URL}${img}` : img));
        } catch {
            const img = product.product_image;
            if (img) {
                setExistingImages([img.startsWith('/') ? `${API_URL}${img}` : img]);
            } else {
                setExistingImages([]);
            }
        }
        setShowForm(true);
    };

    const executeDelete = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/products/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Product deleted successfully");
                fetchProducts();
            } else {
                toast.error(data.error || "Failed to delete product");
            }
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error("Server error while deleting");
        }
    };

    const handleStatusUpdate = async (id: string, status: "ACTIVE" | "REJECTED") => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/products/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(status === "ACTIVE" ? "Product accepted & active" : "Product declined");
                fetchProducts();
            } else {
                toast.error(data.error || "Failed to update status");
            }
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Server error while updating status");
        }
    };

    const handleDelete = (id: string) => {
        toast("Are you sure you want to delete this product?", {
            action: {
                label: "Delete",
                onClick: () => executeDelete(id)
            },
            cancel: {
                label: "Cancel",
                onClick: () => { }
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingId && imageFiles.length === 0 && existingImages.length === 0) {
            toast.error("Please upload at least one product image.");
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token");

            // 1. Combine existing images and upload new images
            let finalUrls: string[] = [...existingImages];

            if (imageFiles.length > 0) {
                const formData = new FormData();
                imageFiles.forEach(file => formData.append("images", file));

                const uploadRes = await apiFetch(`${API_URL}/api/upload/products`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });

                if (!uploadRes.ok) throw new Error("Failed to upload images");
                const uploadData = await uploadRes.json();
                finalUrls = [...finalUrls, ...uploadData.urls];
            }

            const finalImageString = JSON.stringify(finalUrls);

            // 2. Submit Product Form
            const payload: any = {
                client_id: "5d0b58cf-aa25-4088-8032-4dbd913a4be4",
                brand: "Admin Added Brand",
                product_name: form.product_name,
                product_link: form.product_link,
                platform: form.platform,
                refund_amount: Number(form.refund_amount) || 0,
                total_slots: Number(form.total_slots) || 0,
                daily_limit: 100,
                deadline: form.deadline ? new Date(form.deadline).toISOString() : new Date().toISOString(),
                instructions: "1. Click Buy\n2. Submit Order ID",
                is_public: form.is_public,
                wa_target: form.wa_target,
                wa_custom_phones: form.wa_target === "custom" ? form.wa_custom_phones : "",
                wa_template: form.wa_template,
                wa_schedule_frequency: form.wa_schedule_frequency,
                wa_schedule_days: form.wa_schedule_days
            };

            if (finalUrls.length > 0) {
                payload.product_image = finalUrls.join(",");
            } else {
                payload.product_image = "";
            }

            const url = editingId ? `${API_URL}/api/products/${editingId}` : `${API_URL}/api/products`;
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save product");

            resetForm();
            fetchProducts();
            toast.success(editingId ? "Product updated successfully!" : "Product added and listed for customers!");
        } catch (error) {
            toast.error("Error saving product. Check console.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLaunchWhatsApp = async () => {
        if (!selectedWaProduct) return;
        setIsSendingWa(true);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                product_id: selectedWaProduct.id,
                template: waTemplate,
                target: waTarget,
                custom_phones: waTarget === "custom" ? customPhones : "",
                scheduled_at: waScheduledAt ? new Date(waScheduledAt).toISOString() : undefined
            };

            // This endpoint will be created in the backend to communicate with the local agent
            const res = await apiFetch(`${API_URL}/api/whatsapp/launch`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to launch WhatsApp campaign");
            }

            toast.success(`WhatsApp campaign launched for ${selectedWaProduct.product_name}!`);
            setIsWaModalOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to communicate with Local WhatsApp Agent. Is it running?");
        } finally {
            setIsSendingWa(false);
        }
    };

    const insertWaVariable = (variable: string) => {
        setWaTemplate((prev) => prev + ` {{${variable}}}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Products</h1>
                    <p className="text-gray-500">Add, edit, or deactivate product campaigns.</p>
                </div>
                <Button onClick={() => {
                    if (showForm) resetForm();
                    else setShowForm(true);
                }}>{showForm ? "Cancel" : "Add New Product"}</Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader><CardTitle>{editingId ? "Edit Product" : "New Product"}</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Product Name <span className="text-red-500">*</span></Label>
                                <Input placeholder="e.g., Wireless Mouse" required value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Product Images (Up to 6) {!editingId && <span className="text-red-500">*</span>}</Label>
                                <MultiImageDropzone
                                    onFilesAdded={handleImageChange}
                                    disabled={existingImages.length + imageFiles.length >= 6}
                                    maxFiles={6}
                                    currentCount={existingImages.length + imageFiles.length}
                                />
                                {existingImages.length > 0 && (
                                    <div className="flex flex-col mt-2 gap-1">
                                        <p className="text-xs text-gray-500">Current Images:</p>
                                        <div className="flex gap-2 overflow-x-auto p-2 bg-gray-50 rounded border">
                                            {existingImages.map((src, idx) => {
                                                let displaySrc = src;
                                                if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                                                    displaySrc = src.startsWith('/') ? `${API_URL}${src}` : `${API_URL}/uploads/${src}`;
                                                }
                                                return (
                                                    <div key={`exist-${idx}`} className="relative group shrink-0">
                                                        <img src={displaySrc} alt={`Existing ${idx + 1}`} className="h-20 w-20 object-cover rounded shadow-sm border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExistingImage(idx)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {imagePreviews.length > 0 && (
                                    <div className="flex flex-col mt-2 gap-1">
                                        <p className="text-xs text-blue-500">New Uploads:</p>
                                        <div className="flex gap-2 overflow-x-auto p-2 bg-blue-50 rounded border border-blue-100">
                                            {imagePreviews.map((src, idx) => (
                                                <div key={`new-${idx}`} className="relative group shrink-0">
                                                    <img src={src} alt={`Preview ${idx + 1}`} className="h-20 w-20 object-cover rounded shadow-sm border border-blue-200" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewImage(idx)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Affiliate / Product Link <span className="text-red-500">*</span></Label>
                                <Input placeholder="https://amazon.in/dp/B000000000?tag=my-affiliate" required value={form.product_link} onChange={e => setForm({ ...form, product_link: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Platform <span className="text-red-500">*</span></Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={form.platform}
                                    onChange={e => setForm({ ...form, platform: e.target.value })}
                                >
                                    <option value="AMAZON">Amazon</option>
                                    <option value="FLIPKART">Flipkart</option>
                                    <option value="MYNTRA">Myntra</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Refund Amount (₹) <span className="text-red-500">*</span></Label>
                                <Input type="number" placeholder="1000" required min="1" value={form.refund_amount} onChange={e => setForm({ ...form, refund_amount: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Deal End Date <span className="text-red-500">*</span></Label>
                                <Input type="date" required value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Total Slots <span className="text-red-500">*</span></Label>
                                <Input type="number" placeholder="50" required min="1" value={form.total_slots} onChange={e => setForm({ ...form, total_slots: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Visibility <span className="text-red-500">*</span></Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={form.is_public ? "true" : "false"}
                                    onChange={e => setForm({ ...form, is_public: e.target.value === "true" })}
                                >
                                    <option value="true">Public (Shows on Customer Dashboard)</option>
                                    <option value="false">Exclusive (Direct Link Only)</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 mt-4">
                                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Auto-WhatsApp Blast (Optional)</h3>
                            </div>

                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={form.wa_target}
                                    onChange={(e) => setForm({ ...form, wa_target: e.target.value })}
                                >
                                    <option value="all_customers">All Registered Customers</option>
                                    <option value="verified_customers">Verified Customers</option>
                                    <option value="custom">Custom (Select specific groups or numbers)</option>
                                </select>
                            </div>

                            <div className="space-y-4 md:col-span-2 p-4 bg-gray-50 border rounded-lg mt-2 mb-4">
                                <h4 className="font-medium">Scheduling</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Schedule Frequency</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={form.wa_schedule_frequency}
                                            onChange={(e) => setForm({ ...form, wa_schedule_frequency: e.target.value })}
                                        >
                                            <option value="NONE">Don't Schedule (Send Once Immediately)</option>
                                            <option value="DAILY">Daily</option>
                                            <option value="ONCE_A_WEEK">Once a Week</option>
                                            <option value="TWICE_A_WEEK">Twice a Week</option>
                                        </select>
                                    </div>

                                    {form.wa_schedule_frequency !== "NONE" && form.wa_schedule_frequency !== "DAILY" && (
                                        <div className="space-y-2">
                                            <Label>Schedule Days</Label>
                                            <Input
                                                placeholder="e.g. MONDAY, THURSDAY"
                                                value={form.wa_schedule_days}
                                                onChange={(e) => setForm({ ...form, wa_schedule_days: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {form.wa_target === "custom" && (
                                <div className="space-y-2 md:col-span-2 p-4 bg-gray-50 border rounded-lg">
                                    <Label>Phone Numbers or Group Names <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        className="font-mono text-sm min-h-[80px]"
                                        placeholder="e.g. 919876543210, +1 555-0100, Freebie Reviewers Group"
                                        value={form.wa_custom_phones}
                                        onChange={(e) => setForm({ ...form, wa_custom_phones: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Enter comma-separated phone numbers or exact WhatsApp group names. The local agent will automatically search for and message each one.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2 md:col-span-2">
                                <Label>Message Template</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {['product_name', 'platform', 'refund_amount', 'available_slots', 'product_link', 'deadline'].map(v => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, wa_template: prev.wa_template + ` {{${v}}}` }))}
                                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs border cursor-pointer font-mono"
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                                <Textarea
                                    className="min-h-[200px] font-mono whitespace-pre-wrap"
                                    value={form.wa_template}
                                    onChange={(e) => setForm({ ...form, wa_template: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mb-2">
                                    Leave blank to disable auto-blasting. The local agent will replace these variables with actual product data and blast the message upon saving.
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : (editingId ? "Save Changes" : "Add & List Product")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {!showForm && (
                <div className="space-y-4">
                    {products.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No products listed yet.</p>
                    ) : (
                        products.map((p) => (
                            <Card key={p.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {(() => {
                                        let firstImg = "";
                                        if (p.product_image) {
                                            try {
                                                const parsed = JSON.parse(p.product_image);
                                                firstImg = Array.isArray(parsed) ? parsed[0] : parsed;
                                            } catch {
                                                firstImg = p.product_image;
                                            }
                                        } else if (firstImg && !firstImg.startsWith('http') && !firstImg.startsWith('data:')) {
                                            // Some seed images might just be filenames "image.jpg"
                                            // or were saved as relative without a leading slash. Try fetching from uploads.
                                            firstImg = firstImg.startsWith('/') ? `${API_URL}${firstImg}` : `${API_URL}/uploads/${firstImg}`;
                                        }
                                        return firstImg ? (
                                            <img
                                                src={firstImg}
                                                alt={p.product_name}
                                                className="h-16 w-16 object-cover rounded border"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : null;
                                    })()}
                                    <div>
                                        <h3 className="font-semibold text-lg hover:underline cursor-pointer" onClick={() => window.open(`/p/${p.id}`, "_blank")}>
                                            {p.product_name}
                                            {p.is_public !== undefined && (
                                                <span className={`ml-2 text-xs px-2 py-0.5 rounded border ${p.is_public ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {p.is_public ? "Public" : "Exclusive"}
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500">{p.platform} • ₹{p.refund_amount}/review • Ends {new Date(p.deadline).toLocaleDateString()}</p>
                                        <p className="text-sm text-gray-500 mt-1">Slots: {p.filled_slots}/{p.total_slots} filled</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                                        {p.status}
                                    </span>
                                    {p.status === "REQUESTED" ? (
                                        <>
                                            <Button variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-50" onClick={() => handleStatusUpdate(p.id, "ACTIVE")}>
                                                Accept
                                            </Button>
                                            <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50" onClick={() => handleStatusUpdate(p.id, "REJECTED")}>
                                                Decline
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-green-600 text-green-600 hover:bg-green-50"
                                                onClick={() => {
                                                    setSelectedWaProduct(p);
                                                    setWaScheduledAt("");
                                                    setIsWaModalOpen(true);
                                                }}
                                            >
                                                <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleEditClick(p)}>Edit</Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>Delete</Button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* WhatsApp Campaign Modal */}
            <Dialog open={isWaModalOpen} onOpenChange={setIsWaModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Launch WhatsApp Campaign</DialogTitle>
                    </DialogHeader>

                    {selectedWaProduct && (
                        <div className="space-y-4 py-4">
                            <div className="bg-gray-50 p-3 rounded border text-sm">
                                <p><strong>Product:</strong> {selectedWaProduct.product_name}</p>
                                <p><strong>Slots Available:</strong> {selectedWaProduct.total_slots - selectedWaProduct.filled_slots}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Target Audience <span className="text-red-500">*</span></Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={waTarget}
                                        onChange={(e) => setWaTarget(e.target.value)}
                                    >
                                        <option value="all_customers">All Registered Customers</option>
                                        <option value="verified_customers">Verified Customers</option>
                                        <option value="custom">Custom (Select specific groups or numbers)</option>
                                    </select>
                                </div>

                                {waTarget === "custom" && (
                                    <div className="space-y-2 p-4 bg-gray-50 border rounded-lg">
                                        <Label>Phone Numbers or Group Names <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            className="font-mono text-sm min-h-[80px]"
                                            placeholder="e.g. 919876543210, +1 555-0100, Freebie Reviewers Group"
                                            value={customPhones}
                                            onChange={(e) => setCustomPhones(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Enter comma-separated phone numbers or exact WhatsApp group names. The local agent will automatically search for and message each one.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Schedule Launch (Optional)</Label>
                                    <Input
                                        type="datetime-local"
                                        value={waScheduledAt}
                                        onChange={(e) => setWaScheduledAt(e.target.value)}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Leave empty to launch immediately. Otherwise, the Agent will automatically blast messages at the selected date and time.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Message Template Variables</Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {['product_name', 'platform', 'refund_amount', 'available_slots', 'product_link', 'deadline'].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => insertWaVariable(v)}
                                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs border cursor-pointer font-mono"
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                    <Textarea
                                        className="min-h-[200px] font-mono whitespace-pre-wrap break-all"
                                        value={waTemplate}
                                        onChange={(e) => setWaTemplate(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500">
                                        The local agent will replace these variables with actual product data and blast the message.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWaModalOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8"
                            disabled={isSendingWa}
                            onClick={handleLaunchWhatsApp}
                        >
                            <MessageCircle className="w-4 h-4" />
                            {isSendingWa ? "Launching..." : "Launch Campaign"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

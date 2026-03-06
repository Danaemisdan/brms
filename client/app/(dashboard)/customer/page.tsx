"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function CustomerDashboardContent() {
    const searchParams = useSearchParams();
    const autoSubmitId = searchParams.get("submit");

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    // Form State
    const [orderForm, setOrderForm] = useState({
        orderId: "",
        amount: "",
        screenshot: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        fetchPublicProducts();
    }, []);

    useEffect(() => {
        if (autoSubmitId && products.length > 0) {
            const prod = products.find(p => p.id === autoSubmitId);
            if (prod) {
                openSubmitModal(prod);
            }
        }
    }, [autoSubmitId, products]);

    const fetchPublicProducts = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsLoading(false);
        }
    };

    const parseImages = (imgStr: string | null) => {
        if (!imgStr) return [];
        try {
            const parsed = JSON.parse(imgStr);
            const urls = Array.isArray(parsed) ? parsed : [parsed];
            return urls.map(u => u.startsWith('/') ? `${API_URL}${u}` : u);
        } catch {
            return imgStr.startsWith('/') ? [`${API_URL}${imgStr}`] : [imgStr];
        }
    };

    const openSubmitModal = (product: any) => {
        setSelectedProduct(product);
        setIsSubmitModalOpen(true);
        setSubmitError("");
        setOrderForm({ orderId: "", amount: "", screenshot: "" });
    };

    const handleOrderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");
        if (!orderForm.screenshot) {
            setSubmitError("Please upload an order screenshot.");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                product_id: selectedProduct.id,
                order_id: orderForm.orderId,
                amount: orderForm.amount,
                screenshot_url: "https://dummyimage.com/600x400/000/fff&text=Order+Screenshot"
            };

            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/orders/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Submission failed");
            }

            toast.success("Order Proof Submitted Successfully! You can track refunds in the 'My Submissions' tab.");
            setIsSubmitModalOpen(false);
        } catch (error: any) {
            setSubmitError(error.message || "Failed to submit order proof. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="py-12 text-center text-gray-500">Loading open campaigns...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Active Campaigns</h1>
                <p className="text-gray-500">Buy these products, upload your order proof, and get refunded after reviewing.</p>
            </div>

            {products.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                    No active campaigns available at the moment. Please check back later!
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => {
                        const images = parseImages(product.product_image);
                        return (
                            <Card key={product.id} className="overflow-hidden flex flex-col">
                                <div className="bg-gray-100 h-48 flex items-center justify-center p-4 relative group">
                                    {images.length > 0 ? (
                                        <div className="flex overflow-x-auto w-full h-full snap-x snap-mandatory hide-scrollbar">
                                            {images.map((img, idx) => (
                                                <div key={idx} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center">
                                                    <img src={img} alt={`${product.product_name} - ${idx + 1}`} className="max-h-full object-contain mix-blend-multiply" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">No Image</span>
                                    )}
                                    {images.length > 1 && (
                                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
                                            {images.length} images (scroll ➡️)
                                        </div>
                                    )}
                                </div>
                                <CardContent className="flex-1 p-5 space-y-4">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">{product.platform}</Badge>
                                            <span className="text-sm font-semibold text-green-600 font-mono">₹{product.refund_amount}</span>
                                        </div>
                                        <h3 className="font-semibold text-lg line-clamp-2">{product.product_name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">by {product.brand}</p>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        <span className="font-medium text-gray-900">{product.total_slots - product.filled_slots}</span> slots remaining
                                    </div>

                                    <div className="pt-2 space-y-2 flex-grow flex flex-col justify-end">
                                        <a href={product.product_link} target="_blank" rel="noreferrer" className="w-full">
                                            <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50 hover:text-blue-700">Buy Product</Button>
                                        </a>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => openSubmitModal(product)}>Submit Order ID</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Submit Order Proof</DialogTitle>
                    </DialogHeader>
                    {selectedProduct && (
                        <form className="space-y-4 pt-4" onSubmit={handleOrderSubmit}>
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md mb-4">
                                <h4 className="font-semibold text-blue-900">{selectedProduct.product_name}</h4>
                                <p className="text-sm text-blue-700">Refund: ₹{selectedProduct.refund_amount}</p>
                            </div>
                            <div>
                                <Label>Order ID (from {selectedProduct.platform}) <span className="text-red-500">*</span></Label>
                                <Input
                                    className="mt-1 bg-white"
                                    placeholder="e.g. 405-1234567-9876543"
                                    required
                                    value={orderForm.orderId}
                                    onChange={(e) => setOrderForm({ ...orderForm, orderId: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Total Amount Paid <span className="text-red-500">*</span></Label>
                                <Input
                                    className="mt-1 bg-white"
                                    placeholder="₹"
                                    type="number"
                                    required
                                    min="1"
                                    value={orderForm.amount}
                                    onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Order Screenshot <span className="text-red-500">*</span></Label>
                                <p className="text-xs text-red-600 font-medium my-1.5 flex items-start gap-1 p-2 bg-red-50 rounded-md border border-red-100">
                                    <span className="text-red-600 mt-0.5">⚠️</span>
                                    Please upload a "Full Long Screenshot" that clearly shows the entire Total Order Value, Product Name, and Shipping Address. Small or cropped screenshots will be rejected by the AI.
                                </p>
                                <div className="mt-2">
                                    <ImageUpload
                                        value={orderForm.screenshot}
                                        onChange={(val) => setOrderForm({ ...orderForm, screenshot: val })}
                                    />
                                </div>
                            </div>

                            {submitError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{submitError}</p>}

                            <Button type="submit" className="w-full mt-4" size="lg" disabled={isSubmitting}>
                                {isSubmitting ? "Submitting..." : "Submit Order Details"}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function CustomerDashboard() {
    return (
        <Suspense fallback={<div className="py-12 text-center text-gray-500">Loading dashboard...</div>}>
            <CustomerDashboardContent />
        </Suspense>
    );
}

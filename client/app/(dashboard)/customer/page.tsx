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
import { Share2, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const API_URL = "";

function CustomerDashboardContent() {
    const searchParams = useSearchParams();
    const autoSubmitId = searchParams.get("submit");

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [termsProduct, setTermsProduct] = useState<any>(null);

    // Form State
    const [orderForm, setOrderForm] = useState<{orderId: string, amount: string, profileName?: string, screenshot: string}>({
        orderId: "",
        amount: "",
        profileName: "",
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
        
        const highlightProductId = searchParams.get("highlight_product");
        if (highlightProductId && products.length > 0) {
            setTimeout(() => {
                const el = document.getElementById(`product-${highlightProductId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add("ring-4", "ring-red-500", "ring-offset-2", "scale-[1.02]", "transition-all", "duration-500");
                    setTimeout(() => {
                        el.classList.remove("ring-4", "ring-red-500", "ring-offset-2", "scale-[1.02]");
                    }, 3000);
                }
            }, 500); // small delay to ensure DOM is ready
        }
    }, [autoSubmitId, searchParams, products]);

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

    const getShortDescription = (dealTypeStr?: string) => {
        if (!dealTypeStr) return "Return Window Screenshot Required";
        const types = dealTypeStr.split(",");
        const reqs = [];
        if (types.includes("Review Deal")) reqs.push("Review");
        if (types.includes("Rating Deal")) reqs.push("Rating");
        if (types.includes("Seller Feedback Deal")) reqs.push("Seller Feedback");
        
        if (reqs.length > 0) {
            return `${reqs.join(", ")} & Return Window Screenshot Required`;
        }
        return "Return Window Screenshot Required";
    };

    const getTermsBlocks = (dealTypeStr?: string) => {
        if (!dealTypeStr) return ["Only Order"];
        return dealTypeStr.split(",");
    };

    const openSubmitModal = (product: any) => {
        setSelectedProduct(product);
        setIsSubmitModalOpen(true);
        setSubmitError("");
        setOrderForm({ orderId: "", amount: "", profileName: "", screenshot: "" });
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
                profile_name: orderForm.profileName,
                screenshot_url: orderForm.screenshot
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
        return (
            <div className="p-6 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="overflow-hidden flex flex-col relative rounded-2xl shadow-sm border border-gray-100 h-[450px]">
                            <Skeleton className="h-56 w-full rounded-none" />
                            <CardContent className="flex-1 p-5 space-y-4">
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-6 w-full" />
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                </div>
                                <div className="flex gap-2 mt-auto pt-4">
                                    <Skeleton className="h-10 flex-1 rounded-md" />
                                    <Skeleton className="h-10 flex-1 rounded-md" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">Live Deals</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mt-1">
                    Claim these premium products for free after cashback. Hurry, slots fill up fast!
                </p>
            </motion.div>

            {products.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-16 bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl flex flex-col items-center justify-center min-h-[400px]"
                >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-2xl font-semibold text-slate-800">No active campaigns right now</p>
                    <p className="text-muted-foreground mt-2">Check back soon for new premium freebies.</p>
                </motion.div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    {products.map((product) => {
                        const images = parseImages(product.product_image);
                        return (
                            <motion.div variants={itemVariants} key={product.id}>
                                <Card 
                                    id={`product-${product.id}`} 
                                    className="overflow-hidden flex flex-col relative rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 bg-white/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] group"
                                >
                                    {/* Top Right Cashback Badge */}
                                    <div className="absolute top-4 right-0 z-20 bg-gradient-to-r from-red-600 to-red-500 text-white font-extrabold text-xs px-4 py-1.5 rounded-l-full shadow-lg shadow-red-500/30 transform group-hover:scale-105 transition-transform origin-right">
                                        LESS ₹{product.refund_amount} CASHBACK
                                    </div>
                                    
                                    {/* Image Section */}
                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 h-64 flex items-center justify-center relative p-4 overflow-hidden">
                                        <div className="absolute inset-0 bg-black/5 z-10 group-hover:bg-transparent transition-colors duration-500" />
                                        {images.length > 0 ? (
                                            <div className="flex overflow-x-auto w-full h-full snap-x snap-mandatory hide-scrollbar relative z-0">
                                                {images.map((img, idx) => (
                                                    <div key={idx} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center">
                                                        <img src={img} alt={`${product.product_name} - ${idx + 1}`} className="max-h-full max-w-full object-contain mix-blend-multiply rounded-xl transition-transform duration-700 group-hover:scale-110" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-300">
                                                <ShoppingBag className="w-12 h-12 mb-2 opacity-50" />
                                                <span className="font-medium text-sm">No Image</span>
                                            </div>
                                        )}
                                        {images.length > 1 && (
                                            <div className="absolute bottom-3 right-3 z-20 bg-black/60 backdrop-blur-md text-white font-medium text-[10px] px-3 py-1 rounded-full pointer-events-none shadow-md">
                                                {images.length} images (scroll ➡️)
                                            </div>
                                        )}
                                    </div>

                                    <CardContent className="flex-1 p-6 space-y-5 bg-white/90 flex flex-col justify-between">
                                        <div>
                                            <Badge variant="outline" className="bg-red-50/50 text-red-600 border-red-200 hover:bg-red-50 font-bold tracking-wide mb-3 rounded-lg px-3 py-1 text-[10px]">
                                                {product.platform?.toUpperCase() || "DEAL"}
                                            </Badge>
                                            
                                            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1">{product.brand}</p>
                                            <h3 className="font-bold text-xl leading-tight line-clamp-2 text-slate-900 group-hover:text-red-600 transition-colors">{product.product_name}</h3>
                                        </div>
                                        
                                        {/* Pricing Blocks */}
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center transition-colors group-hover:bg-white group-hover:shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Selling Price</span>
                                                <span className="font-black text-xl text-slate-300 line-through decoration-slate-300/50">₹{product.real_price || (Number(product.offer_price || 0) + Number(product.refund_amount || 0))}</span>
                                            </div>
                                            <div className="bg-red-50/80 p-3.5 rounded-2xl border border-red-100 flex flex-col items-center justify-center transition-colors group-hover:bg-red-100/50 group-hover:shadow-sm">
                                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Final Cost</span>
                                                <span className="font-black text-2xl text-red-600">₹{product.offer_price || (product.real_price ? product.real_price - product.refund_amount : 0)}</span>
                                            </div>
                                        </div>

                                        {/* Terms */}
                                        <div className="flex items-center justify-start mt-2">
                                            <button onClick={(e) => { e.preventDefault(); setTermsProduct(product); setIsTermsModalOpen(true); }} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider cursor-pointer py-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                                Terms & Conditions
                                            </button>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-2">
                                            <a href={product.product_link} target="_blank" rel="noreferrer" className="flex-1">
                                                <Button variant="outline" className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-sm shadow-sm transition-all hover:shadow-md">
                                                    Buy Now
                                                </Button>
                                            </a>
                                            <Button 
                                                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold text-sm shadow-md hover:shadow-xl hover:shadow-red-500/20 transition-all hover:-translate-y-0.5" 
                                                onClick={() => openSubmitModal(product)}
                                            >
                                                Submit Proof
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="h-12 w-12 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all" 
                                                onClick={() => {
                                                    const url = `${window.location.origin}/customer?highlight_product=${product.id}`;
                                                    navigator.clipboard.writeText(url);
                                                    toast.success("Link copied to clipboard!");
                                                }} 
                                                title="Share Deal"
                                            >
                                                <Share2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </motion.div>
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
                                <Label>Profile Name <span className="text-red-500">*</span></Label>
                                <Input
                                    className="mt-1 bg-white"
                                    placeholder="Enter your Profile Name"
                                    required
                                    value={orderForm.profileName || ""}
                                    onChange={(e) => setOrderForm({ ...orderForm, profileName: e.target.value })}
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
            <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
                <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Terms & Conditions</DialogTitle>
                    </DialogHeader>
                    {termsProduct && (
                        <div className="space-y-6 pt-4 text-sm text-slate-700">
                            {getTermsBlocks(termsProduct.deal_type).map((type, idx) => {
                                if (type.includes("Only Order")) return (
                                    <div key={idx} className="space-y-2">
                                        <h4 className="font-bold text-slate-900">Only Order Deal</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Cashback is issued upon successful completion of your order.</li>
                                            <li>A clear screenshot of the order's Return Window must be submitted as proof.</li>
                                            <li>Ensure that the screenshot clearly displays all relevant order details.</li>
                                            <li>Failure to provide a valid, clear screenshot will result in cashback rejection.</li>
                                        </ul>
                                    </div>
                                );
                                if (type.includes("Rating Deal")) return (
                                    <div key={idx} className="space-y-2">
                                        <h4 className="font-bold text-slate-900">Rating Deal</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Cashback is issued upon successfully rating the product.</li>
                                            <li>You must submit two clear screenshots: one of your rating, and one of the order's Return Window.</li>
                                            <li>Ensure both screenshots are clearly legible and valid.</li>
                                            <li>Missing or invalid proof for either requirement will result in cashback rejection.</li>
                                        </ul>
                                    </div>
                                );
                                if (type.includes("Review Deal")) return (
                                    <div key={idx} className="space-y-2">
                                        <h4 className="font-bold text-slate-900">Review Deal</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Cashback is issued upon successfully posting a review for the product.</li>
                                            <li>You must submit two clear screenshots: one showing your published review, and one of the order's Return Window.</li>
                                            <li>The review must be publicly visible and successfully posted according to guidelines.</li>
                                            <li>Missing or invalid proof for either requirement will result in cashback rejection.</li>
                                        </ul>
                                    </div>
                                );
                                if (type.includes("Seller Feedback Deal")) return (
                                    <div key={idx} className="space-y-2">
                                        <h4 className="font-bold text-slate-900">Seller Feedback Deal</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Cashback is issued upon successfully submitting feedback for the seller.</li>
                                            <li>You must submit two clear screenshots: one showing your submitted seller feedback, and one of the order's Return Window.</li>
                                            <li>The seller feedback must be successfully submitted and publicly visible.</li>
                                            <li>Missing or invalid proof for either requirement will result in cashback rejection.</li>
                                        </ul>
                                    </div>
                                );
                                return null;
                            })}
                            
                            <div className="space-y-2 mt-6 pt-6 border-t border-slate-100">
                                <h4 className="font-bold text-slate-900">General Terms & Conditions</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Valid, unedited, and genuine proof screenshots are strictly mandatory.</li>
                                    <li>All deal-specific instructions must be followed carefully.</li>
                                    <li>Cashback processing begins only after all details and proofs have been verified and approved by our team.</li>
                                    <li>Submitting screenshots does not guarantee a refund if the specific deal requirements are not met.</li>
                                    <li>Any attempt to submit invalid, edited, duplicate, or misleading proofs will result in immediate rejection.</li>
                                </ul>
                            </div>
                        </div>
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

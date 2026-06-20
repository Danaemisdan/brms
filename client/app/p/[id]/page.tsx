"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function ProductCampaignPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [product, setProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Redirection check: If logged in, send them straight to the Customer Dashboard 
        // passing submit=id so they can participate immediately.
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (token && role === "CUSTOMER") {
            router.push(`/customer/submissions?submit=${id}`);
            return;
        }
        fetchProduct();
    }, [id, router]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`${API_URL}/api/products/${id}/campaign`);
            if (res.ok) {
                const data = await res.json();

                // If it's an exclusive product (not public) and they aren't logged in, force login.
                const token = localStorage.getItem("token");
                if (data.product.is_public === false && !token) {
                    router.push(`/login?returnUrl=/p/${id}`);
                    return;
                }

                setProduct(data.product);
            } else {
                setProduct(null);
            }
        } catch (error) {
            console.error("Failed to load product", error);
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

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading campaign...</div>;
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 text-center">
                <Card className="max-w-md">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-red-600 mb-2">Campaign Not Found</h2>
                        <p className="text-gray-600">This campaign may have ended, or the link is invalid. Check with your coordinator.</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 relative">
            <div className="max-w-2xl w-full space-y-8">
                {/* Product Header */}
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="bg-blue-600 p-8 text-foreground">
                        <Badge variant="outline" className="text-foreground border-border mb-4">
                            {product.platform}
                        </Badge>
                        <h1 className="text-3xl font-bold mb-2">{product.product_name}</h1>
                        <p className="text-blue-100 text-lg">by {product.brand}</p>
                    </div>

                    <CardContent className="p-8 space-y-6">
                        {product.product_image && (
                            <div className="flex overflow-x-auto gap-4 pb-4 mb-2 snap-x snap-mandatory hide-scrollbar justify-center">
                                {parseImages(product.product_image).map((img, idx) => (
                                    <div key={idx} className="flex-shrink-0 snap-center">
                                        <img
                                            src={img}
                                            alt={`${product.product_name} - image ${idx + 1}`}
                                            className="w-48 h-48 object-contain rounded-lg border p-2 bg-white shadow-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center pb-6 border-b">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Refund Amount</p>
                                <p className="text-3xl font-bold text-green-600">₹{product.refund_amount}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 font-medium">Available Slots</p>
                                <p className="text-xl font-bold">
                                    {product.total_slots - product.filled_slots} <span className="text-sm font-normal text-gray-400">/ {product.total_slots}</span>
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 text-center">
                            <h3 className="text-lg font-semibold mb-2">Want to participate and earn a full refund?</h3>
                            <p className="text-sm text-gray-500 mb-6">You need an account to join campaigns, submit order proofs, and claim your refund.</p>
                            <Button
                                className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 text-foreground"
                                onClick={() => router.push('/login')}
                            >
                                Login or Register to Participate
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

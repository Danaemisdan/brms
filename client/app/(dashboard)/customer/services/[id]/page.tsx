"use client";

import { useEffect, useState, use } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { Card, CardTitle, CardDescription, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CustomerServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [service, setService] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchService();
    }, [id]);

    const fetchService = async () => {
        try {
            const res = await apiFetch(`/api/services/${id}`);
            if (res.ok) {
                const data = await res.json();
                setService(data.service);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-12 text-center">Loading...</div>;
    if (!service) return <div className="p-12 text-center text-red-500">Service not found.</div>;

    const publicTasks = service.tasks?.filter((t: any) => t.is_public) || [];
    const publicProducts = service.products?.filter((p: any) => p.is_public) || [];
    const publicForms = service.forms?.filter((f: any) => f.is_public) || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">{service.name}</h1>
                <p className="text-muted-foreground tracking-wide mt-2">{service.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {publicTasks.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-widest border-b pb-2 mb-4 text-primary">Available Tasks</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {publicTasks.map((t: any) => (
                                <Card key={t.id} className="overflow-hidden flex flex-col group border-primary/20 hover:border-primary transition-all">
                                    {t.image_url ? (
                                        <div className="h-48 w-full bg-gray-100 overflow-hidden">
                                            <img src={t.image_url} alt={t.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    ) : (
                                        <div className="h-48 w-full bg-gray-50 flex items-center justify-center">
                                            <span className="text-gray-400">Task Image</span>
                                        </div>
                                    )}
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg line-clamp-1">{t.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col pb-4">
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">{t.description}</p>
                                        <div className="flex justify-between items-center mt-auto border-t pt-4">
                                            <span className="text-lg font-bold text-green-600">₹{t.reward_amount}</span>
                                            <Button size="sm" onClick={() => window.location.href=`/customer/tasks`}>View Tasks</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {publicProducts.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-widest border-b pb-2 mb-4 text-primary">Available Campaigns</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {publicProducts.map((p: any) => (
                                <Card key={p.id} className="overflow-hidden flex flex-col group border-primary/20 hover:border-primary transition-all">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg line-clamp-1">{p.product_name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col pb-4">
                                        <div className="flex justify-between items-center mt-auto pt-2">
                                            <Button size="sm" variant="outline" className="w-full" onClick={() => window.location.href=`/customer/dashboard`}>View Details</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {publicForms.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-widest border-b pb-2 mb-4 text-primary">Data Forms</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {publicForms.map((f: any) => (
                                <Card key={f.id} className="overflow-hidden group border-primary/20 hover:border-primary transition-all">
                                    <CardHeader>
                                        <CardTitle>{f.name}</CardTitle>
                                        <CardDescription>{f.fields?.length || 0} fields to complete</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" onClick={() => window.location.href=`/customer/forms/${f.id}`}>Open Form</Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {publicTasks.length === 0 && publicProducts.length === 0 && publicForms.length === 0 && (
                    <div className="text-center p-12 bg-white rounded-lg border border-dashed text-gray-500">
                        No active offerings in this service currently. Check back later!
                    </div>
                )}
            </div>
        </div>
    );
}

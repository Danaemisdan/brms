"use client";

import { useEffect, useState, use } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { Card, CardTitle, CardDescription, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
                <p className="text-muted-foreground">{service.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            Tasks
                            <Button size="sm" onClick={() => window.location.href='/admin/tasks'}>Add</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {service.tasks?.length === 0 ? <p className="text-sm text-gray-500">No tasks linked.</p> : (
                            <ul className="space-y-2">
                                {service.tasks?.map((t: any) => <li key={t.id} className="text-sm p-2 bg-gray-50 rounded border">{t.title}</li>)}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            Products
                            <Button size="sm" onClick={() => window.location.href='/admin/products'}>Add</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {service.products?.length === 0 ? <p className="text-sm text-gray-500">No products linked.</p> : (
                            <ul className="space-y-2">
                                {service.products?.map((p: any) => <li key={p.id} className="text-sm p-2 bg-gray-50 rounded border">{p.product_name}</li>)}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            Forms
                            <Button size="sm" onClick={() => window.location.href='/admin/custom-forms'}>Add</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {service.forms?.length === 0 ? <p className="text-sm text-gray-500">No forms linked.</p> : (
                            <ul className="space-y-2">
                                {service.forms?.map((f: any) => <li key={f.id} className="text-sm p-2 bg-gray-50 rounded border">{f.name}</li>)}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

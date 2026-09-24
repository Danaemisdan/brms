"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

export default function AdminServicesPage() {
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        icon: ""
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/services");
            if (res.ok) {
                const data = await res.json();
                setServices(data.services);
            }
        } catch (error) {
            toast.error("Failed to load services");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiFetch("/api/services", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success("Service created successfully");
                setIsCreating(false);
                setFormData({ name: "", description: "", icon: "" });
                fetchServices();
                // Optionally reload to update sidebar
                window.location.reload();
            } else {
                toast.error("Failed to create service");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Services Management</h1>
                    <p className="text-muted-foreground mt-1">Create dynamic services that appear in the sidebar.</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    <Plus className="mr-2 h-4 w-4" /> {isCreating ? 'Cancel' : 'New Service'}
                </Button>
            </div>

            {isCreating && (
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle>Create New Service Category</CardTitle>
                        <CardDescription>This will appear in the sidebar navigation for all users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Service Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="E.g., Map Reviews, PR Articles..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe what this service is about..." />
                            </div>
                            <Button type="submit">Publish Service</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : services.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-lg border border-dashed text-gray-500">No services found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(service => (
                        <Card key={service.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50 border-b">
                                <CardTitle>{service.name}</CardTitle>
                                <p className="text-sm text-gray-500 mt-1">{service.description || "No description"}</p>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Button variant="outline" className="w-full" onClick={() => window.location.href = `/admin/services/${service.id}`}>Manage Tasks & Forms</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomFormsPage() {
    const [forms, setForms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/custom-forms");
            if (res.ok) {
                const data = await res.json();
                setForms(data);
            }
        } catch (error) {
            toast.error("Failed to load custom forms");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this form? All its data will be lost.")) return;
        
        try {
            const res = await apiFetch(`/api/custom-forms/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Form deleted");
                fetchForms();
            }
        } catch (error) {
            toast.error("Failed to delete form");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Custom Data Models</h1>
                    <p className="text-muted-foreground mt-1">Create dynamic forms and map them to any Google Sheet tab.</p>
                </div>
                <Link href="/admin/custom-forms/builder">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Form
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : forms.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-lg border border-dashed">
                    <p className="text-gray-500 mb-4">No custom forms found. Create your first dynamic form!</p>
                    <Link href="/admin/custom-forms/builder">
                        <Button variant="outline">Create Form</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forms.map(form => (
                        <Card key={form.id} className="overflow-hidden flex flex-col cursor-pointer hover:border-primary transition-colors" onClick={() => router.push(`/admin/custom-forms/${form.id}`)}>
                            <CardHeader className="pb-2 bg-gray-50 border-b">
                                <CardTitle className="text-xl flex justify-between items-start">
                                    <span className="line-clamp-1">{form.name}</span>
                                </CardTitle>
                                <p className="text-sm text-gray-500">Target Sheet: <span className="font-mono bg-gray-200 px-1 rounded">{form.sheet_name}</span></p>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col pt-4">
                                <p className="text-sm mb-4 flex-1">
                                    <span className="font-semibold text-gray-700">{form.fields.length}</span> mapped fields
                                </p>
                                
                                <div className="flex justify-between items-center gap-2 pt-2 border-t mt-auto" onClick={(e) => e.stopPropagation()}>
                                    <Link href={`/admin/custom-forms/builder?id=${form.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Edit className="w-4 h-4 mr-2" /> Edit Schema
                                        </Button>
                                    </Link>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(form.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

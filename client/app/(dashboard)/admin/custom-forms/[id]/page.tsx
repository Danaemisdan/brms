"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface FieldDef {
    id: string;
    name: string;
    type: string;
    column: string;
}

export default function CustomFormEntryPage() {
    const router = useRouter();
    const { id } = useParams() as { id: string };

    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [form, setForm] = useState<any>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        loadForm();
    }, [id]);

    const loadForm = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch(`/api/custom-forms/${id}`);
            if (res.ok) {
                const data = await res.json();
                setForm(data);
                
                // Initialize empty form data
                const initialData: Record<string, any> = {};
                (data.fields || []).forEach((f: FieldDef) => {
                    initialData[f.name] = "";
                });
                setFormData(initialData);
            } else {
                toast.error("Form not found");
                router.push("/admin/custom-forms");
            }
        } catch (error) {
            toast.error("Failed to load form");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleImageUpload = async (fieldName: string, files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];
        
        const toastId = toast.loading("Processing image...");
        try {
            const buffer = await file.arrayBuffer();
            const base64String = Buffer.from(buffer).toString('base64');
            const dataUri = `data:${file.type};base64,${base64String}`;
            handleInputChange(fieldName, dataUri);
            toast.success("Image added", { id: toastId });
        } catch (error) {
            toast.error("Failed to process image", { id: toastId });
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const toastId = toast.loading("Submitting entry and syncing to Google Sheets...");
        
        try {
            const res = await apiFetch(`/api/custom-forms/${id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: formData })
            });

            if (res.ok) {
                toast.success("Data successfully submitted & pushed to Sheets!", { id: toastId });
                // Reset form
                const resetData: Record<string, any> = {};
                (form.fields || []).forEach((f: FieldDef) => {
                    resetData[f.name] = "";
                });
                setFormData(resetData);
            } else {
                toast.error("Failed to submit data.", { id: toastId });
            }
        } catch (error) {
            toast.error("An error occurred during submission", { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
    }

    if (!form) return null;

    const fields = form.fields as FieldDef[];

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/custom-forms">
                    <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{form.name}</h1>
                    <p className="text-muted-foreground mt-1">Data entry for Google Sheet tab: <span className="font-mono bg-gray-200 px-1 rounded">{form.sheet_name}</span></p>
                </div>
            </div>

            <Card className="shadow-lg border-primary/20">
                <CardHeader className="bg-gray-50 border-b">
                    <CardTitle>Submit New Entry</CardTitle>
                    <CardDescription>Fill out the fields below to append a row to your sheet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {fields.map((field) => (
                        <div key={field.id} className="grid gap-2">
                            <Label className="text-base font-semibold text-gray-800">
                                {field.name}
                                <span className="ml-2 text-xs font-mono font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border">Col {field.column}</span>
                            </Label>
                            
                            {field.type === 'textarea' ? (
                                <Textarea 
                                    rows={4} 
                                    value={formData[field.name] || ''} 
                                    onChange={(e) => handleInputChange(field.name, e.target.value)} 
                                />
                            ) : field.type === 'image' ? (
                                <div>
                                    <ImageUpload 
                                        value={formData[field.name] || ""}
                                        onChange={(base64) => handleInputChange(field.name, base64)} 
                                    />
                                </div>
                            ) : (
                                <Input 
                                    type={field.type === 'number' ? 'number' : 'text'} 
                                    value={formData[field.name] || ''} 
                                    onChange={(e) => handleInputChange(field.name, e.target.value)} 
                                />
                            )}
                        </div>
                    ))}
                    
                    <div className="pt-6 border-t">
                        <Button onClick={handleSubmit} disabled={submitting} className="w-full text-lg py-6 shadow-md" size="lg">
                            {submitting ? "Syncing to Google Sheets..." : <><Save className="mr-2 h-5 w-5" /> Submit to "{form.sheet_name}" Sheet</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            
            {form.records && form.records.length > 0 && (
                <div className="mt-12 pt-8 border-t">
                    <h3 className="text-lg font-bold mb-4">Recent Submissions ({form.records.length})</h3>
                    <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border">
                        <p>Most recent sync was at: {new Date(form.records[0].created_at).toLocaleString()}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

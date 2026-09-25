"use client";

import { useEffect, useState, use } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { Card, CardTitle, CardDescription, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";

export default function CustomerFormSubmitPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [formConfig, setFormConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        fetchForm();
    }, [id]);

    const fetchForm = async () => {
        try {
            const res = await apiFetch(`/api/custom-forms/${id}`);
            if (res.ok) {
                const data = await res.json();
                setFormConfig(data);
                
                // Initialize form data
                const initial: Record<string, any> = {};
                data.fields?.forEach((f: any) => {
                    initial[f.id] = f.type === 'multiple_choice' ? [] : (f.type === 'number' ? '' : '');
                });
                setFormData(initial);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldChange = (fieldId: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleImageUpload = async (fieldId: string, files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];
        
        const toastId = toast.loading("Uploading file...");
        try {
            const buffer = await file.arrayBuffer();
            const base64String = Buffer.from(buffer).toString('base64');
            const dataUri = `data:${file.type};base64,${base64String}`;
            
            // In a real app we would upload to a bucket and save the URL. Here we'll pass base64 to be saved or uploaded later.
            handleFieldChange(fieldId, dataUri);
            
            toast.success("File uploaded", { id: toastId });
        } catch (error) {
            toast.error("Failed to upload file", { id: toastId });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate
        for (const field of formConfig.fields) {
            if (field.type === 'multiple_choice') {
                if (!formData[field.id] || formData[field.id].length === 0) {
                    return toast.error(`Please select at least one option for ${field.name}.`);
                }
            } else if (!formData[field.id]) {
                return toast.error(`Please fill out the ${field.name} field.`);
            }
        }

        setIsSubmitting(true);
        try {
            const res = await apiFetch(`/api/custom-forms/${id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: formData })
            });

            if (res.ok) {
                toast.success("Form submitted successfully!");
                // Optionally redirect back or clear
                window.location.href = `/customer/services/${formConfig.service_id || ''}`;
            } else {
                toast.error("Failed to submit form.");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-12 text-center">Loading form...</div>;
    if (!formConfig) return <div className="p-12 text-center text-red-500">Form not found.</div>;

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <Card className="border-primary/20 shadow-lg">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-2xl text-primary">{formConfig.name}</CardTitle>
                    <CardDescription>Please complete the required information below.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {formConfig.fields?.map((field: any) => (
                            <div key={field.id} className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground/80">
                                    {field.name} <span className="text-red-500">*</span>
                                </Label>
                                
                                {field.type === 'text' && (
                                    <Input 
                                        value={formData[field.id] || ''} 
                                        onChange={e => handleFieldChange(field.id, e.target.value)} 
                                        required 
                                        className="h-12 bg-white/5"
                                    />
                                )}
                                
                                {field.type === 'textarea' && (
                                    <Textarea 
                                        value={formData[field.id] || ''} 
                                        onChange={e => handleFieldChange(field.id, e.target.value)} 
                                        required 
                                        rows={4}
                                        className="bg-white/5"
                                    />
                                )}
                                
                                {field.type === 'number' && (
                                    <Input 
                                        type="number"
                                        value={formData[field.id] || ''} 
                                        onChange={e => handleFieldChange(field.id, e.target.value)} 
                                        required 
                                        className="h-12 bg-white/5"
                                    />
                                )}

                                {field.type === 'image' && (
                                    <div className="mt-2 border rounded-md p-4 bg-white/5">
                                        {formData[field.id] ? (
                                            <div className="relative inline-block">
                                                <img src={formData[field.id]} className="h-32 object-contain rounded border bg-white" />
                                                <Button 
                                                    variant="destructive" 
                                                    size="sm" 
                                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full" 
                                                    onClick={() => handleFieldChange(field.id, '')}
                                                >×</Button>
                                            </div>
                                        ) : (
                                            <ImageUpload onFilesAdded={(files) => handleImageUpload(field.id, files)} />
                                        )}
                                    </div>
                                )}

                                {field.type === 'dropdown' && (
                                    <select
                                        value={formData[field.id] || ''}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        required
                                        className="flex h-12 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="">Select an option...</option>
                                        {(field.options || "").split(",").map((opt: string) => opt.trim()).filter((o: string) => o).map((opt: string) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                )}

                                {field.type === 'multiple_choice' && (
                                    <div className="grid gap-3 pt-2">
                                        {(field.options || "").split(",").map((opt: string) => opt.trim()).filter((o: string) => o).map((opt: string) => (
                                            <div key={opt} className="flex items-center space-x-3 bg-white/5 p-3 rounded-md border border-input">
                                                <Checkbox 
                                                    id={`${field.id}-${opt}`}
                                                    checked={(formData[field.id] || []).includes(opt)}
                                                    onCheckedChange={(checked) => {
                                                        const current = formData[field.id] || [];
                                                        if (checked) {
                                                            handleFieldChange(field.id, [...current, opt]);
                                                        } else {
                                                            handleFieldChange(field.id, current.filter((v: string) => v !== opt));
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`${field.id}-${opt}`} className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {opt}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="pt-6">
                            <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

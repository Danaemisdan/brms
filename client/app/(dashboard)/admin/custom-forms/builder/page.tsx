"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface FieldDef {
    id: string;
    name: string;
    type: string;
    column: string;
}

export default function CustomFormBuilderPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams?.get("id");

    const [isLoading, setIsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [formName, setFormName] = useState("");
    const [sheetName, setSheetName] = useState("");
    const [fields, setFields] = useState<FieldDef[]>([]);

    useEffect(() => {
        if (editId) {
            loadForm(editId);
        }
    }, [editId]);

    const loadForm = async (id: string) => {
        setIsLoading(true);
        try {
            const res = await apiFetch(`/api/custom-forms/${id}`);
            if (res.ok) {
                const data = await res.json();
                setFormName(data.name);
                setSheetName(data.sheet_name);
                setFields(data.fields || []);
            }
        } catch (error) {
            toast.error("Failed to load form details");
        } finally {
            setIsLoading(false);
        }
    };

    const addField = () => {
        setFields([...fields, { id: Date.now().toString(), name: "", type: "text", column: "" }]);
    };

    const updateField = (index: number, key: keyof FieldDef, value: string) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [key]: value };
        setFields(newFields);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!formName || !sheetName) {
            return toast.error("Form name and Google Sheet tab name are required.");
        }

        if (fields.length === 0) {
            return toast.error("Add at least one field.");
        }

        for (const f of fields) {
            if (!f.name || !f.column) {
                return toast.error("All fields must have a name and a column letter mapped.");
            }
        }

        setSaving(true);
        try {
            const payload = {
                name: formName,
                sheet_name: sheetName,
                fields: fields,
            };

            let res;
            if (editId) {
                res = await apiFetch(`/api/custom-forms/${editId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await apiFetch("/api/custom-forms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                toast.success(`Form ${editId ? 'updated' : 'created'} successfully!`);
                router.push("/admin/custom-forms");
            } else {
                toast.error("Failed to save form.");
            }
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/custom-forms">
                    <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{editId ? 'Edit Form Schema' : 'Create New Form'}</h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Form Configuration</CardTitle>
                    <CardDescription>Setup the basic details and target sheet.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label>Form Name</Label>
                        <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="E.g., Vendor Onboarding" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Google Sheet Tab Name</Label>
                        <Input value={sheetName} onChange={(e) => setSheetName(e.target.value)} placeholder="E.g., Sheet1" />
                        <p className="text-xs text-gray-500">Must exactly match the tab name in your spreadsheet.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle>Fields Mapping</CardTitle>
                        <CardDescription>Define the form fields and map them to Google Sheet columns (A, B, C...).</CardDescription>
                    </div>
                    <Button onClick={addField} variant="secondary" size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Add Field
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.length === 0 ? (
                        <div className="text-center p-8 border border-dashed rounded-lg bg-gray-50">
                            <p className="text-gray-500">No fields added yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            <div className="grid grid-cols-12 gap-3 mb-2 px-2 hidden sm:grid">
                                <div className="col-span-5 font-semibold text-sm text-gray-500">Field Name</div>
                                <div className="col-span-4 font-semibold text-sm text-gray-500">Data Type</div>
                                <div className="col-span-2 font-semibold text-sm text-gray-500">Sheet Column</div>
                            </div>
                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center border rounded p-3 sm:p-0 sm:border-0 sm:bg-transparent bg-gray-50">
                                    <div className="col-span-5">
                                        <Label className="sm:hidden mb-1 block">Field Name</Label>
                                        <Input value={field.name} onChange={(e) => updateField(index, "name", e.target.value)} placeholder="E.g., Applicant Name" />
                                    </div>
                                    <div className="col-span-4">
                                        <Label className="sm:hidden mb-1 block">Data Type</Label>
                                        <select 
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={field.type} 
                                            onChange={(e) => updateField(index, "type", e.target.value)}
                                        >
                                            <option value="text">Text (Short)</option>
                                            <option value="textarea">Text (Long)</option>
                                            <option value="number">Number</option>
                                            <option value="image">Image / File</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="sm:hidden mb-1 block">Column (A, B, C...)</Label>
                                        <Input value={field.column} onChange={(e) => updateField(index, "column", e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder="e.g. A" className="uppercase font-mono text-center" />
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => removeField(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pt-4">
                <Link href="/admin/custom-forms">
                    <Button variant="outline" disabled={saving}>Cancel</Button>
                </Link>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Configuration</>}
                </Button>
            </div>
        </div>
    );
}

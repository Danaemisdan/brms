"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/auth";

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [reward, setReward] = useState("0");
    const [isPublic, setIsPublic] = useState(true);
    const [imageStr, setImageStr] = useState<string>("");

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/tasks");
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            toast.error("Failed to load tasks");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDialog = (task?: any) => {
        if (task) {
            setEditingId(task.id);
            setTitle(task.title);
            setDescription(task.description);
            setReward(task.reward_amount.toString());
            setIsPublic(task.is_public);
            setImageStr(task.image_url || "");
        } else {
            setEditingId(null);
            setTitle("");
            setDescription("");
            setReward("0");
            setIsPublic(true);
            setImageStr("");
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!title || !description) {
            return toast.error("Title and description are required.");
        }

        setSaving(true);
        try {
            const payload = {
                title,
                description,
                reward_amount: reward,
                is_public: isPublic,
                image_url: imageStr,
            };

            let res;
            if (editingId) {
                res = await apiFetch(`/api/tasks/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await apiFetch("/api/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                toast.success(`Task ${editingId ? 'updated' : 'created'} successfully!`);
                setIsDialogOpen(false);
                fetchTasks();
            } else {
                toast.error("Failed to save task.");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        
        try {
            const res = await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Task deleted");
                fetchTasks();
            }
        } catch (error) {
            toast.error("Failed to delete task");
        }
    };

    const handleImageUpload = async (files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];
        
        const toastId = toast.loading("Uploading image...");
        try {
            const buffer = await file.arrayBuffer();
            const base64String = Buffer.from(buffer).toString('base64');
            const dataUri = `data:${file.type};base64,${base64String}`;
            setImageStr(dataUri);
            toast.success("Image uploaded", { id: toastId });
        } catch (error) {
            toast.error("Failed to upload image", { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground mt-1">Manage simple tasks and campaigns for users.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : tasks.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-lg border border-dashed">
                    <p className="text-gray-500 mb-4">No tasks found. Create your first task!</p>
                    <Button variant="outline" onClick={() => handleOpenDialog()}>Create Task</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => (
                        <Card key={task.id} className="overflow-hidden flex flex-col">
                            {task.image_url ? (
                                <div className="h-48 w-full bg-gray-100 overflow-hidden relative">
                                    <img src={task.image_url} alt={task.title} className="object-cover w-full h-full" />
                                    {!task.is_public && (
                                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center">
                                            <XCircle className="w-3 h-3 mr-1"/> Hidden
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-48 w-full bg-gray-50 flex items-center justify-center relative">
                                    <span className="text-gray-400">No Image</span>
                                    {!task.is_public && (
                                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center">
                                            <XCircle className="w-3 h-3 mr-1"/> Hidden
                                        </div>
                                    )}
                                </div>
                            )}
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl line-clamp-1">{task.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col pb-4">
                                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">{task.description}</p>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-bold text-green-600">₹{task.reward_amount}</span>
                                </div>
                                <div className="flex justify-between items-center gap-2 pt-2 border-t">
                                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(task)} className="flex-1">
                                        <Pencil className="w-4 h-4 mr-2" /> Edit
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(task.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Task" : "Create New Task"}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Task Title</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g., Follow our Instagram page" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description & Instructions</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide clear instructions on how to complete this task..." rows={4} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reward">Reward Amount (₹)</Label>
                            <Input id="reward" type="number" value={reward} onChange={(e) => setReward(e.target.value)} placeholder="0" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Task Image</Label>
                            {imageStr ? (
                                <div className="relative rounded-md overflow-hidden border h-32 bg-gray-50">
                                    <img src={imageStr} className="w-full h-full object-contain" />
                                    <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setImageStr("")}>Remove</Button>
                                </div>
                            ) : (
                                <ImageUpload onFilesAdded={handleImageUpload} />
                            )}
                        </div>
                        <div className="flex items-center justify-between border rounded-lg p-3">
                            <div className="space-y-0.5">
                                <Label>Publicly Visible</Label>
                                <p className="text-sm text-gray-500">Should users see this task right now?</p>
                            </div>
                            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Task"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

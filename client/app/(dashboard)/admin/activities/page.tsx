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

export default function AdminActivitiesPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        requirements: "",
        reward_amount: "",
        deadline: ""
    });

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/admin/activities");
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            }
        } catch (error) {
            toast.error("Failed to load activities");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiFetch("/api/admin/activities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success("Activity created successfully");
                setIsCreating(false);
                setFormData({ title: "", description: "", requirements: "", reward_amount: "", deadline: "" });
                fetchActivities();
            } else {
                toast.error("Failed to create activity");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleStatusUpdate = async (applicationId: string, status: string) => {
        try {
            const res = await apiFetch(`/api/admin/applications/${applicationId}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                toast.success(`Application marked as ${status}`);
                fetchActivities();
            } else {
                toast.error("Failed to update status");
            }
        } catch {
            toast.error("Error updating status");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Creator Activities</h1>
                    <p className="text-muted-foreground mt-1">Manage campaigns and review creator submissions.</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    <Plus className="mr-2 h-4 w-4" /> {isCreating ? 'Cancel' : 'New Activity'}
                </Button>
            </div>

            {isCreating && (
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle>Create New Activity</CardTitle>
                        <CardDescription>Post a new campaign for creators to apply to.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="E.g., Diwali Fashion Campaign" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Reward Amount (₹)</Label>
                                    <Input type="number" value={formData.reward_amount} onChange={e => setFormData({...formData, reward_amount: e.target.value})} required placeholder="1500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required placeholder="Describe the campaign..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Requirements</Label>
                                <Textarea value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} required placeholder="1 Instagram Reel, tags, mentions..." />
                            </div>
                            <Button type="submit">Publish Activity</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : activities.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-lg border border-dashed text-gray-500">No activities found.</div>
            ) : (
                <div className="space-y-6">
                    {activities.map(activity => (
                        <Card key={activity.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50 border-b flex flex-row justify-between items-center">
                                <div>
                                    <CardTitle>{activity.title}</CardTitle>
                                    <p className="text-sm text-gray-500 mt-1">Reward: ₹{activity.reward_amount} | Status: {activity.status}</p>
                                </div>
                                <div className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                                    {activity.applications.length} Applicants
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-sm mb-6 pb-6 border-b">
                                    <p className="font-semibold mb-1">Requirements:</p>
                                    <p className="whitespace-pre-wrap">{activity.requirements}</p>
                                </div>
                                
                                <h3 className="font-semibold mb-4">Applications</h3>
                                {activity.applications.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No applications yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {activity.applications.map((app: any) => (
                                            <div key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg bg-white">
                                                <div className="mb-4 sm:mb-0">
                                                    <p className="font-medium">Creator ID: {app.creator_id}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Applied: {new Date(app.applied_at).toLocaleDateString()}</p>
                                                    <p className="text-sm mt-1">
                                                        Status: <span className="font-semibold px-2 py-0.5 rounded bg-gray-100">{app.status}</span>
                                                    </p>
                                                    {app.reel_link && (
                                                        <a href={app.reel_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                                                            View Submitted Reel
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    {app.status === 'PENDING' && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleStatusUpdate(app.id, 'REJECTED')}>Reject</Button>
                                                            <Button size="sm" onClick={() => handleStatusUpdate(app.id, 'SHORTLISTED')}>Shortlist</Button>
                                                        </>
                                                    )}
                                                    {app.status === 'SUBMITTED' && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleStatusUpdate(app.id, 'REJECTED')}>Reject Reel</Button>
                                                            <Button size="sm" onClick={() => handleStatusUpdate(app.id, 'APPROVED')} className="bg-green-600 hover:bg-green-700">Approve & Pay</Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

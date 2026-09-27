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

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminActivitiesPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
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

    const filteredActivities = activities.filter(a => 
        a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Creator Activities</h1>
                    <p className="text-muted-foreground mt-1">Manage campaigns and review creator submissions.</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)} className="shrink-0">
                    <Plus className="mr-2 h-4 w-4" /> {isCreating ? 'Cancel' : 'New Activity'}
                </Button>
            </div>

            {isCreating && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Create New Activity</CardTitle>
                        <CardDescription>Post a new campaign for creators to apply to.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <Card>
                <CardHeader className="pb-4">
                    <input 
                        type="text" 
                        placeholder="Search activities by title..." 
                        className="flex h-10 w-full md:max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
                    ) : filteredActivities.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg">No activities found.</div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Campaign Title</TableHead>
                                        <TableHead>Reward</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Applicants</TableHead>
                                        <TableHead>Applications & Submissions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredActivities.map(activity => (
                                        <TableRow key={activity.id} className="align-top">
                                            <TableCell className="max-w-[250px]">
                                                <div className="font-semibold">{activity.title}</div>
                                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{activity.description}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-2">Reqs: {activity.requirements}</div>
                                            </TableCell>
                                            <TableCell className="font-medium text-green-600">
                                                ₹{activity.reward_amount}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{activity.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-none">
                                                    {activity.applications.length}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {activity.applications.length === 0 ? (
                                                    <span className="text-xs text-muted-foreground italic">No applications</span>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {activity.applications.map((app: any) => (
                                                            <div key={app.id} className="text-sm bg-slate-50 p-2 rounded-md border flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                                                                <div>
                                                                    <div className="font-medium text-xs">Creator #{app.creator_id}</div>
                                                                    <div className="text-[10px] text-muted-foreground">Applied: {new Date(app.applied_at).toLocaleDateString()}</div>
                                                                    <div className="mt-1">
                                                                        <Badge variant={app.status === 'APPROVED' ? 'default' : app.status === 'REJECTED' ? 'destructive' : 'secondary'} className="text-[10px] h-4 px-1 py-0 shadow-none">
                                                                            {app.status}
                                                                        </Badge>
                                                                    </div>
                                                                    {app.reel_link && (
                                                                        <a href={app.reel_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-[10px] hover:underline mt-1 inline-block">
                                                                            View Reel 🔗
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    {app.status === 'PENDING' && (
                                                                        <>
                                                                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-red-600" onClick={() => handleStatusUpdate(app.id, 'REJECTED')}>Reject</Button>
                                                                            <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => handleStatusUpdate(app.id, 'SHORTLISTED')}>Shortlist</Button>
                                                                        </>
                                                                    )}
                                                                    {app.status === 'SUBMITTED' && (
                                                                        <>
                                                                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-red-600" onClick={() => handleStatusUpdate(app.id, 'REJECTED')}>Reject</Button>
                                                                            <Button size="sm" className="h-6 text-[10px] px-2 bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(app.id, 'APPROVED')}>Approve</Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

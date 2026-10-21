"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle, XCircle, ExternalLink, RefreshCw, Sparkles, Video, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminActivitiesPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Correction / Feedback Dialog
    const [correctionAppId, setCorrectionAppId] = useState<string | null>(null);
    const [correctionRemark, setCorrectionRemark] = useState("");

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
                toast.success("Activity published successfully! Verified creators can now apply.");
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

    const handleStatusUpdate = async (applicationId: string, status: string, remarks?: string) => {
        try {
            const res = await apiFetch(`/api/admin/applications/${applicationId}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, remarks })
            });

            if (res.ok) {
                if (status === 'SHORTLISTED') {
                    toast.success("Creator shortlisted! Notification sent: 'Congratulations! You have been shortlisted for this activity...'");
                } else if (status === 'APPROVED') {
                    toast.success("Reel approved! Reward credited directly to creator's wallet.");
                } else {
                    toast.success(`Application updated to ${status}`);
                }
                setCorrectionAppId(null);
                setCorrectionRemark("");
                fetchActivities();
            } else {
                toast.error("Failed to update status");
            }
        } catch {
            toast.error("Error updating application status");
        }
    };

    const filteredActivities = activities.filter(a => 
        a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 relative z-10 pb-16">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-wider uppercase">
                        Creator Activities & Submissions
                    </h1>
                    <p className="text-sm font-sans tracking-wide text-foreground/50 mt-1">
                        Publish campaigns, shortlist verified creators, and review submitted Reel deliverables.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={fetchActivities}
                        className="border-border text-foreground hover:bg-muted text-xs h-10 px-3 rounded-lg"
                    >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                    </Button>
                    <Button 
                        onClick={() => setIsCreating(!isCreating)} 
                        className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs tracking-wider uppercase h-10 px-4 rounded-xl shadow-xs transition-all"
                    >
                        <Plus className="mr-1.5 h-4 w-4" /> {isCreating ? 'Cancel' : 'New Activity'}
                    </Button>
                </div>
            </div>

            {/* Create Activity Form */}
            {isCreating && (
                <Card className="border border-border bg-card/60 rounded-2xl p-6 shadow-xs">
                    <CardHeader className="p-0 pb-4">
                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Create New Creator Activity Campaign
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Verified creators will be able to view and apply for this activity through their Creator Dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Campaign Title <span className="text-red-500">*</span>
                                    </Label>
                                    <Input 
                                        value={formData.title} 
                                        onChange={e => setFormData({...formData, title: e.target.value})} 
                                        required 
                                        placeholder="e.g. Summer Skincare Reel Campaign" 
                                        className="h-11 bg-background border-border text-foreground text-xs rounded-xl focus:border-zinc-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Creator Payout Reward (₹) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input 
                                        type="number" 
                                        value={formData.reward_amount} 
                                        onChange={e => setFormData({...formData, reward_amount: e.target.value})} 
                                        required 
                                        placeholder="1500" 
                                        className="h-11 bg-background border-border text-foreground text-xs rounded-xl focus:border-zinc-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Description & Overview <span className="text-red-500">*</span>
                                </Label>
                                <Textarea 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})} 
                                    required 
                                    placeholder="Provide context about the brand, product, and campaign objective..." 
                                    className="bg-background border-border text-foreground text-xs rounded-xl min-h-[70px] focus:border-zinc-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Activity Deliverables & Guidelines <span className="text-red-500">*</span>
                                </Label>
                                <Textarea 
                                    value={formData.requirements} 
                                    onChange={e => setFormData({...formData, requirements: e.target.value})} 
                                    required 
                                    placeholder="1 Instagram Reel (minimum 30s), mandatory tags @samplelelo, keywords, review guidelines..." 
                                    className="bg-background border-border text-foreground text-xs rounded-xl min-h-[70px] focus:border-zinc-400"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="border-border text-foreground hover:bg-muted text-xs h-10 px-4 rounded-xl" 
                                    onClick={() => setIsCreating(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs tracking-wider uppercase h-10 px-6 rounded-xl shadow-xs transition-all"
                                >
                                    Publish Campaign
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Activities Table */}
            <Card className="border border-border bg-card/60 rounded-2xl overflow-hidden shadow-xs">
                <CardHeader className="pb-3 border-b border-border">
                    <Input 
                        type="text" 
                        placeholder="Search activities by title or keyword..." 
                        className="h-10 max-w-sm bg-background border-border text-xs text-foreground placeholder:text-muted-foreground rounded-xl focus:border-zinc-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-16 text-center text-xs text-muted-foreground animate-pulse">Loading activity records...</div>
                    ) : filteredActivities.length === 0 ? (
                        <div className="p-16 text-center text-xs text-muted-foreground">No activities found. Click "New Activity" to create one.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="text-xs font-semibold text-foreground/70">Campaign Details</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Reward</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Status</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Applicant Applications & Reel Submissions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredActivities.map(activity => (
                                        <TableRow key={activity.id} className="align-top border-border hover:bg-muted/40">
                                            <TableCell className="max-w-[280px]">
                                                <div className="font-bold text-sm text-foreground">{activity.title}</div>
                                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{activity.description}</div>
                                                <div className="text-[11px] text-muted-foreground mt-2 bg-muted/50 p-2 rounded-lg border border-border/60">
                                                    <strong className="text-foreground">Deliverables:</strong> {activity.requirements}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono font-bold text-emerald-400">
                                                ₹{activity.reward_amount}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] bg-muted/60 border-border text-foreground">
                                                    {activity.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {activity.applications.length === 0 ? (
                                                    <span className="text-xs text-muted-foreground italic">No applications received yet</span>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {activity.applications.map((app: any) => {
                                                            const creator = app.creator;
                                                            const prof = creator?.creator_profile;

                                                            return (
                                                                <div key={app.id} className="p-3.5 bg-muted/40 rounded-xl border border-border flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-xs text-foreground">
                                                                                {creator?.name || `Creator #${app.creator_id.substring(0, 8)}`}
                                                                            </span>
                                                                            {prof?.category_tier && (
                                                                                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                                                                    {prof.category_tier}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-[11px] text-foreground/60">
                                                                            {creator?.mobile} • {prof?.content_category || "General"} • {prof?.follower_count ? `${prof.follower_count.toLocaleString()} Followers` : (prof?.follower_range || "")}
                                                                        </div>
                                                                        {prof?.profile_urls?.[0] && (
                                                                            <a href={prof.profile_urls[0]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[11px] flex items-center gap-1 font-mono">
                                                                                <ExternalLink className="w-3 h-3" /> Profile Link
                                                                            </a>
                                                                        )}
                                                                        <div className="flex items-center gap-2 pt-1">
                                                                            <Badge 
                                                                                className={`text-[10px] ${
                                                                                    app.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                                                    app.status === 'SHORTLISTED' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                                                                    app.status === 'SUBMITTED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                                                                    app.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                                                    'bg-white/10 text-foreground/70'
                                                                                }`}
                                                                            >
                                                                                {app.status === 'SUBMITTED' ? 'Reel Submitted (Review Required)' : app.status}
                                                                            </Badge>
                                                                            {app.reel_link && (
                                                                                <a 
                                                                                    href={app.reel_link} 
                                                                                    target="_blank" 
                                                                                    rel="noopener noreferrer" 
                                                                                    className="text-xs text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1.5 underline"
                                                                                >
                                                                                    <Video className="w-3.5 h-3.5" /> View Submitted Reel <ExternalLink className="w-3 h-3" />
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Action Buttons for Application Lifecycle */}
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {app.status === 'PENDING' && (
                                                                            <>
                                                                                <Button 
                                                                                    size="sm" 
                                                                                    variant="outline" 
                                                                                    className="h-8 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 rounded-lg"
                                                                                    onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                                                                                >
                                                                                    Reject
                                                                                </Button>
                                                                                <Button 
                                                                                    size="sm" 
                                                                                    className="h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3.5 rounded-lg shadow-sm"
                                                                                    onClick={() => handleStatusUpdate(app.id, 'SHORTLISTED')}
                                                                                >
                                                                                    Shortlist Creator
                                                                                </Button>
                                                                            </>
                                                                        )}

                                                                        {app.status === 'SUBMITTED' && (
                                                                            <>
                                                                                <Button 
                                                                                    size="sm" 
                                                                                    variant="outline" 
                                                                                    className="h-8 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 px-3 rounded-lg"
                                                                                    onClick={() => {
                                                                                        setCorrectionAppId(app.id);
                                                                                        setCorrectionRemark("Please check mandatory hashtags and brand tag");
                                                                                    }}
                                                                                >
                                                                                    Correction
                                                                                </Button>
                                                                                <Button 
                                                                                    size="sm" 
                                                                                    variant="outline" 
                                                                                    className="h-8 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 px-2.5 rounded-lg"
                                                                                    onClick={() => handleStatusUpdate(app.id, 'REJECTED', 'Deliverable did not meet guidelines')}
                                                                                >
                                                                                    Reject
                                                                                </Button>
                                                                                <Button 
                                                                                    size="sm" 
                                                                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-lg shadow-sm font-semibold"
                                                                                    onClick={() => handleStatusUpdate(app.id, 'APPROVED')}
                                                                                >
                                                                                    Approve Reel & Pay
                                                                                </Button>
                                                                            </>
                                                                        )}

                                                                        {app.status === 'APPROVED' && (
                                                                            <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                                                                                <CheckCircle className="w-3.5 h-3.5" /> Credited
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
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

            {/* Request Correction Modal */}
            <Dialog open={!!correctionAppId} onOpenChange={(open) => !open && setCorrectionAppId(null)}>
                <DialogContent className="max-w-md bg-card border border-border p-6 rounded-2xl text-card-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-amber-500 font-bold text-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Request Reel Correction
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Specify what changes the creator needs to make. This note will be sent directly to their Creator Dashboard.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-3">
                        <Textarea 
                            value={correctionRemark}
                            onChange={e => setCorrectionRemark(e.target.value)}
                            placeholder="e.g. Please add mandatory brand tag @samplelelo in caption and resubmit Reel link"
                            className="bg-background border-border text-xs text-foreground rounded-xl min-h-[80px]"
                        />

                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                className="flex-1 border-border text-xs h-10 rounded-xl"
                                onClick={() => setCorrectionAppId(null)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs h-10 rounded-xl"
                                disabled={!correctionRemark.trim()}
                                onClick={() => correctionAppId && handleStatusUpdate(correctionAppId, 'CORRECTION_REQUIRED', correctionRemark)}
                            >
                                Send Correction Request
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

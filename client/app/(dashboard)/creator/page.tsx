"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Lock, Wallet, Upload, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

export default function CreatorDashboardPage() {
    const [profile, setProfile] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [reelLink, setReelLink] = useState("");

    const [formData, setFormData] = useState({
        profile_urls: [""],
        follower_count: "",
        content_category: "",
        engagement_rate: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const profRes = await apiFetch("/api/creator/profile");
            if (profRes.ok) {
                const profData = await profRes.json();
                setProfile(profData);
                setFormData({
                    profile_urls: profData.profile_urls?.length ? profData.profile_urls : [""],
                    follower_count: profData.follower_count || "",
                    content_category: profData.content_category || "",
                    engagement_rate: profData.engagement_rate || ""
                });

                if (profData.is_verified) {
                    const actRes = await apiFetch("/api/creator/activities");
                    if (actRes.ok) {
                        setActivities(await actRes.json());
                    }
                }
            }
        } catch (error) {
            toast.error("Failed to load dashboard");
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await apiFetch("/api/creator/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success("Profile submitted for verification!");
                fetchData();
            } else {
                toast.error("Failed to submit profile");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleApply = async (activityId: string) => {
        try {
            const res = await apiFetch(`/api/creator/activities/${activityId}/apply`, { method: "POST" });
            if (res.ok) {
                toast.success("Application submitted successfully!");
                fetchData();
            } else {
                toast.error("Failed to apply");
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    const handleSubmitReel = async (appId: string) => {
        if (!reelLink) return toast.error("Please enter a reel link");
        try {
            const res = await apiFetch(`/api/creator/applications/${appId}/submit-reel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reel_link: reelLink })
            });
            if (res.ok) {
                toast.success("Reel submitted successfully!");
                setReelLink("");
                fetchData();
            } else {
                toast.error("Failed to submit reel");
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
    }

    if (!profile?.is_verified) {
        return (
            <div className="p-6 max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Creator Verification Required</h1>
                    <p className="text-muted-foreground mt-2">Please complete your profile to unlock the Creator Dashboard and apply for campaigns.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile Details</CardTitle>
                        <CardDescription>Our team will review your profile and follower base.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="space-y-4 border p-4 rounded-md bg-gray-50/50">
                                <div className="flex items-center justify-between">
                                    <Label>Profile URLs (Instagram, YouTube, etc.)</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setFormData({...formData, profile_urls: [...formData.profile_urls, ""]})}>
                                        + Add Link
                                    </Button>
                                </div>
                                {formData.profile_urls.map((url: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input 
                                            value={url} 
                                            onChange={e => {
                                                const newUrls = [...formData.profile_urls];
                                                newUrls[idx] = e.target.value;
                                                setFormData({...formData, profile_urls: newUrls});
                                            }} 
                                            required 
                                            placeholder="https://instagram.com/yourhandle" 
                                            className="flex-1"
                                        />
                                        {formData.profile_urls.length > 1 && (
                                            <Button type="button" variant="destructive" onClick={() => {
                                                const newUrls = formData.profile_urls.filter((_: string, i: number) => i !== idx);
                                                setFormData({...formData, profile_urls: newUrls});
                                            }}>Remove</Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <Label>Follower Count</Label>
                                <Input type="number" value={formData.follower_count} onChange={e => setFormData({...formData, follower_count: e.target.value})} required placeholder="e.g. 15000" />
                            </div>
                            <div className="space-y-2">
                                <Label>Content Category</Label>
                                <Input value={formData.content_category} onChange={e => setFormData({...formData, content_category: e.target.value})} required placeholder="e.g. Fashion, Tech, Lifestyle" />
                            </div>
                            <div className="space-y-2">
                                <Label>Average Engagement Rate (%)</Label>
                                <Input type="number" step="0.1" value={formData.engagement_rate} onChange={e => setFormData({...formData, engagement_rate: e.target.value})} placeholder="e.g. 4.5" />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSaving}>
                                {isSaving ? "Saving..." : "Submit for Verification"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Creator Dashboard</h1>
                <p className="text-muted-foreground mt-1 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" /> 
                    Verified Creator Profile • {profile.category_tier || 'Standard'} Tier
                </p>
            </div>

            <h2 className="text-xl font-bold border-b pb-2">Available Campaigns</h2>
            
            {activities.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-lg border border-dashed text-gray-500">No campaigns available right now.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activities.map(activity => {
                        const myApp = activity.applications[0];
                        
                        return (
                            <Card key={activity.id} className="flex flex-col border-primary/10 hover:border-primary/30 transition-colors">
                                <CardHeader className="bg-gray-50 border-b pb-4">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl">{activity.title}</CardTitle>
                                        <div className="flex items-center text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-sm">
                                            <DollarSign className="w-4 h-4 mr-1" /> {activity.reward_amount}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col pt-4 space-y-4">
                                    <p className="text-sm text-gray-600">{activity.description}</p>
                                    <div className="bg-gray-50 p-3 rounded text-sm">
                                        <p className="font-semibold mb-1">Requirements:</p>
                                        <p className="text-gray-600 whitespace-pre-wrap">{activity.requirements}</p>
                                    </div>

                                    <div className="mt-auto pt-4">
                                        {!myApp ? (
                                            <Button className="w-full" onClick={() => handleApply(activity.id)}>Apply for Campaign</Button>
                                        ) : myApp.status === 'PENDING' ? (
                                            <Button className="w-full" variant="secondary" disabled>Application Pending</Button>
                                        ) : myApp.status === 'SHORTLISTED' ? (
                                            <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                <p className="text-sm font-semibold text-blue-800 flex items-center"><CheckCircle className="w-4 h-4 mr-2"/> You've been Shortlisted!</p>
                                                <p className="text-xs text-blue-600">Complete the activity and submit your reel link.</p>
                                                <div className="flex gap-2">
                                                    <Input placeholder="Instagram Reel URL" value={reelLink} onChange={e => setReelLink(e.target.value)} />
                                                    <Button onClick={() => handleSubmitReel(myApp.id)}><Upload className="w-4 h-4" /></Button>
                                                </div>
                                            </div>
                                        ) : myApp.status === 'SUBMITTED' ? (
                                            <Button className="w-full bg-yellow-100 text-yellow-800 border-yellow-200" variant="outline" disabled>Reel Under Review</Button>
                                        ) : myApp.status === 'APPROVED' ? (
                                            <Button className="w-full bg-green-100 text-green-800 border-green-200" variant="outline" disabled>Approved & Paid!</Button>
                                        ) : (
                                            <Button className="w-full bg-red-100 text-red-800 border-red-200" variant="outline" disabled>Application Rejected</Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

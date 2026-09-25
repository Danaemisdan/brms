"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Lock, Upload, DollarSign, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

const PLATFORMS = ["YouTube", "Instagram", "Facebook", "LinkedIn", "Other"];
const FOLLOWER_RANGES = ["500-3000", "3000-5000", "5000-10000", "10000-25000", "25000+"];
const CONTENT_TYPES = ["Only Story", "Only Reel", "Reel + Story"];
const COLLABORATION_TYPES = ["Paid", "Barter"];

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
        engagement_rate: "",
        platforms: [] as string[],
        follower_range: "",
        content_types: [] as string[],
        collaboration_types: [] as string[]
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
                    engagement_rate: profData.engagement_rate || "",
                    platforms: profData.platforms || [],
                    follower_range: profData.follower_range || "",
                    content_types: profData.content_types || [],
                    collaboration_types: profData.collaboration_types || []
                });

                if (profData.platforms && profData.platforms.length > 0) {
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

    const handleCheckboxChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => {
            const list = prev[field] as string[];
            if (list.includes(value)) {
                return { ...prev, [field]: list.filter(v => v !== value) };
            } else {
                return { ...prev, [field]: [...list, value] };
            }
        });
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.platforms.length || !formData.follower_range || !formData.content_types.length || !formData.collaboration_types.length) {
            toast.error("Please fill out all required multiselect fields.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await apiFetch("/api/creator/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success("Profile submitted successfully! Dashboard Unlocked.");
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

    const isProfileComplete = profile && profile.platforms && profile.platforms.length > 0;

    if (!isProfileComplete) {
        return (
            <div className="p-6 max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Creator Dashboard Locked</h1>
                    <p className="text-muted-foreground mt-2">Submit your creator profile details to unlock campaigns immediately.</p>
                </div>

                <Card className="shadow-lg border-primary/20">
                    <CardHeader className="bg-gray-50 border-b">
                        <CardTitle>Creator Profile Registration</CardTitle>
                        <CardDescription>Tell us about your audience and content style.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleProfileSubmit} className="space-y-8">
                            
                            {/* Profile Links */}
                            <div className="space-y-4 border p-5 rounded-lg bg-white shadow-sm">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-bold">Profile URLs</Label>
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
                                            placeholder="e.g. https://instagram.com/yourhandle" 
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

                            {/* Platforms */}
                            <div className="space-y-3">
                                <Label className="text-base font-bold">Platforms <span className="text-red-500">*</span></Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {PLATFORMS.map(p => (
                                        <div key={p} className="flex items-center space-x-2 bg-gray-50 p-3 rounded border">
                                            <Checkbox 
                                                id={`plat-${p}`} 
                                                checked={formData.platforms.includes(p)}
                                                onCheckedChange={() => handleCheckboxChange('platforms', p)}
                                            />
                                            <Label htmlFor={`plat-${p}`} className="cursor-pointer">{p}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Follower Range */}
                            <div className="space-y-3">
                                <Label className="text-base font-bold">Follower Range <span className="text-red-500">*</span></Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {FOLLOWER_RANGES.map(r => (
                                        <div key={r} className="flex items-center space-x-2 bg-gray-50 p-3 rounded border cursor-pointer hover:bg-gray-100" onClick={() => setFormData({...formData, follower_range: r})}>
                                            <input type="radio" checked={formData.follower_range === r} readOnly className="w-4 h-4 text-primary" />
                                            <Label className="cursor-pointer">{r}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Content Types */}
                            <div className="space-y-3">
                                <Label className="text-base font-bold">Content Type <span className="text-red-500">*</span></Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {CONTENT_TYPES.map(c => (
                                        <div key={c} className="flex items-center space-x-2 bg-gray-50 p-3 rounded border">
                                            <Checkbox 
                                                id={`cont-${c}`} 
                                                checked={formData.content_types.includes(c)}
                                                onCheckedChange={() => handleCheckboxChange('content_types', c)}
                                            />
                                            <Label htmlFor={`cont-${c}`} className="cursor-pointer">{c}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Collaboration Types */}
                            <div className="space-y-3">
                                <Label className="text-base font-bold">Collaboration Type <span className="text-red-500">*</span></Label>
                                <div className="flex gap-4">
                                    {COLLABORATION_TYPES.map(c => (
                                        <div key={c} className="flex items-center space-x-2 bg-gray-50 p-3 rounded border w-40">
                                            <Checkbox 
                                                id={`collab-${c}`} 
                                                checked={formData.collaboration_types.includes(c)}
                                                onCheckedChange={() => handleCheckboxChange('collaboration_types', c)}
                                            />
                                            <Label htmlFor={`collab-${c}`} className="cursor-pointer">{c}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" className="w-full text-lg h-12" disabled={isSaving}>
                                {isSaving ? "Submitting..." : "Submit & Unlock Dashboard"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Creator Deals</h1>
                    <p className="text-muted-foreground mt-1 flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" /> 
                        Profile Active • {profile.category_tier || 'Standard'} Tier
                    </p>
                </div>
            </div>
            
            {activities.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl shadow-sm border text-gray-500">No creator campaigns available right now.</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {activities.map(activity => {
                        const myApp = activity.applications[0];
                        
                        return (
                            <Card key={activity.id} className="overflow-hidden flex flex-col relative rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                {/* Top Right Badge */}
                                <div className="absolute top-4 right-0 z-10 bg-green-600 text-white font-bold text-xs px-3 py-1.5 rounded-l-lg shadow-sm">
                                    REWARD ₹{activity.reward_amount}
                                </div>
                                
                                {/* Image Section (Placeholder gradient for Activities) */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 h-48 flex flex-col items-center justify-center relative group p-4 border-b">
                                    <ImageIcon className="w-12 h-12 text-indigo-200 mb-2" />
                                    <span className="text-indigo-400 font-semibold uppercase tracking-widest text-xs">Creator Collab</span>
                                </div>

                                <CardContent className="flex-1 p-5 space-y-4 bg-white flex flex-col">
                                    <div>
                                        <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 font-semibold mb-3 rounded-md px-3">
                                            CAMPAIGN
                                        </Badge>
                                        <h3 className="font-bold text-lg leading-tight line-clamp-2 text-slate-900">{activity.title}</h3>
                                    </div>
                                    
                                    <div className="text-sm text-slate-600 line-clamp-3">
                                        {activity.description}
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                                        <p className="font-bold text-slate-900 mb-1">Requirements:</p>
                                        <p className="text-slate-600 line-clamp-3">{activity.requirements}</p>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-50">
                                        {!myApp ? (
                                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleApply(activity.id)}>
                                                Apply Now
                                            </Button>
                                        ) : myApp.status === 'PENDING' ? (
                                            <Button className="w-full" variant="secondary" disabled>Application Pending</Button>
                                        ) : myApp.status === 'SHORTLISTED' ? (
                                            <div className="space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                <p className="text-sm font-bold text-blue-900 flex items-center"><CheckCircle className="w-4 h-4 mr-2"/> Shortlisted!</p>
                                                <p className="text-xs text-blue-700 font-medium">Submit your final reel/post link here.</p>
                                                <div className="flex gap-2">
                                                    <Input placeholder="URL" className="h-9 text-xs" value={reelLink} onChange={e => setReelLink(e.target.value)} />
                                                    <Button size="sm" onClick={() => handleSubmitReel(myApp.id)}><Upload className="w-4 h-4" /></Button>
                                                </div>
                                            </div>
                                        ) : myApp.status === 'SUBMITTED' ? (
                                            <Button className="w-full bg-yellow-100 text-yellow-800 border-yellow-200 font-bold" variant="outline" disabled>Under Review</Button>
                                        ) : myApp.status === 'APPROVED' ? (
                                            <Button className="w-full bg-green-100 text-green-800 border-green-200 font-bold" variant="outline" disabled>Approved & Paid!</Button>
                                        ) : (
                                            <Button className="w-full bg-red-100 text-red-800 border-red-200 font-bold" variant="outline" disabled>Rejected</Button>
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

"use client";

import { useState, useEffect } from "react";
import { 
    CheckCircle2, 
    Lock, 
    Upload, 
    DollarSign, 
    ExternalLink, 
    Clock, 
    AlertCircle, 
    Sparkles, 
    Wallet, 
    ArrowUpRight, 
    ShieldCheck, 
    Video, 
    Share2, 
    Instagram, 
    Youtube, 
    Check, 
    RefreshCw,
    XCircle,
    Info,
    Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

const PLATFORMS = ["Instagram", "YouTube", "Facebook", "LinkedIn", "Twitter/X", "Other"];
const FOLLOWER_RANGES = [
    { label: "Nano (500 - 5,000)", value: "500-5000", tier: "Nano Creator" },
    { label: "Micro (5,000 - 25,000)", value: "5000-25000", tier: "Micro Creator" },
    { label: "Mid-Tier (25,000 - 100,000)", value: "25000-100000", tier: "Mid-Tier Creator" },
    { label: "Macro (100,000+)", value: "100000+", tier: "Macro Creator" }
];
const CATEGORIES = [
    "Fashion & Apparel",
    "Beauty & Personal Care",
    "Tech & Gadgets",
    "Health & Fitness",
    "Food & Cooking",
    "Home & Living",
    "Travel & Lifestyle",
    "Comedy & Entertainment",
    "Parenting & Family",
    "Other"
];
const CONTENT_TYPES = ["Instagram Reel", "YouTube Short", "Story Post", "Feed Post / Review"];
const COLLABORATION_TYPES = ["Paid Collabs", "Product Exchange / Barter", "Review & Keep"];

export default function CreatorDashboardPage() {
    const [profile, setProfile] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"available" | "shortlisted" | "submitted" | "approved">("available");

    // Reel submission state
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [reelLink, setReelLink] = useState("");
    const [isSubmittingReel, setIsSubmittingReel] = useState(false);

    // Wallet Redemption state
    const [isRedeemOpen, setIsRedeemOpen] = useState(false);
    const [redeemAmount, setRedeemAmount] = useState("");
    const [upiId, setUpiId] = useState("");
    const [isRedeeming, setIsRedeeming] = useState(false);

    // Profile form state
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
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setIsLoading(true);
        try {
            const profRes = await apiFetch("/api/creator/profile");
            if (profRes.ok) {
                const profData = await profRes.json();
                setProfile(profData);
                setFormData({
                    profile_urls: profData.profile_urls?.length ? profData.profile_urls : [""],
                    follower_count: profData.follower_count?.toString() || "",
                    content_category: profData.content_category || "",
                    engagement_rate: profData.engagement_rate?.toString() || "",
                    platforms: profData.platforms || [],
                    follower_range: profData.follower_range || "",
                    content_types: profData.content_types || [],
                    collaboration_types: profData.collaboration_types || []
                });

                if (profData.user?.upi_id) {
                    setUpiId(profData.user.upi_id);
                }

                // If verified, fetch activities and notifications
                if (profData.is_verified) {
                    const [actRes, notifRes] = await Promise.all([
                        apiFetch("/api/creator/activities"),
                        apiFetch("/api/creator/notifications")
                    ]);

                    if (actRes.ok) {
                        setActivities(await actRes.json());
                    }
                    if (notifRes.ok) {
                        setNotifications(await notifRes.json());
                    }
                }
            }
        } catch (error) {
            console.error("Dashboard load error:", error);
            toast.error("Failed to load creator data.");
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
        
        if (!formData.platforms.length || !formData.follower_range || !formData.content_category) {
            toast.error("Please fill in platforms, follower range, and content category.");
            return;
        }

        const validUrls = formData.profile_urls.filter(u => u.trim() !== "");
        if (validUrls.length === 0) {
            toast.error("Please provide at least one valid profile URL (e.g. Instagram handle link).");
            return;
        }

        setIsSaving(true);
        try {
            const res = await apiFetch("/api/creator/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, profile_urls: validUrls })
            });

            if (res.ok) {
                toast.success("Creator profile submitted for verification! The Sample Lelo Team will review your details.");
                await fetchDashboard();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "Failed to submit profile.");
            }
        } catch {
            toast.error("Network error while submitting profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleApply = async (activityId: string) => {
        try {
            const res = await apiFetch(`/api/creator/activities/${activityId}/apply`, { method: "POST" });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Application submitted! The Sample Lelo Team will review your profile against requirements.");
                fetchDashboard();
            } else {
                toast.error(data.error || "Failed to submit application.");
            }
        } catch {
            toast.error("Error submitting application.");
        }
    };

    const handleSubmitReel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAppId || !reelLink.trim()) {
            toast.error("Please provide a valid Reel link.");
            return;
        }

        setIsSubmittingReel(true);
        try {
            const res = await apiFetch(`/api/creator/applications/${selectedAppId}/submit-reel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reel_link: reelLink.trim() })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Reel link submitted successfully! It is now under review by the Sample Lelo Team.");
                setReelLink("");
                setSelectedAppId(null);
                fetchDashboard();
            } else {
                toast.error(data.error || "Failed to submit Reel link.");
            }
        } catch {
            toast.error("Error submitting Reel link.");
        } finally {
            setIsSubmittingReel(false);
        }
    };

    const handleRedeemWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(redeemAmount);
        const walletBal = profile?.user?.wallet_balance || 0;

        if (!amt || amt <= 0) {
            toast.error("Enter a valid redemption amount.");
            return;
        }

        if (amt > walletBal) {
            toast.error(`Requested amount exceeds available balance of ₹${walletBal.toFixed(2)}`);
            return;
        }

        if (!upiId.trim() || !upiId.includes("@")) {
            toast.error("Please provide a valid UPI ID (e.g., creator@okaxis).");
            return;
        }

        setIsRedeeming(true);
        try {
            const res = await apiFetch("/api/v1/wallet/redeem-upi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: amt, upi_id: upiId.trim() })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(`Redemption of ₹${amt} initiated successfully!`);
                setIsRedeemOpen(false);
                setRedeemAmount("");
                fetchDashboard();
            } else {
                toast.error(data.error || "Redemption request failed.");
            }
        } catch {
            toast.error("Error processing redemption.");
        } finally {
            setIsRedeeming(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full" />
                <p className="text-xs text-foreground/50 font-mono tracking-wider uppercase">Loading Creator Dashboard...</p>
            </div>
        );
    }

    const isProfileSubmitted = Boolean(profile?.platforms && profile.platforms.length > 0 && profile.follower_range);
    const isVerified = Boolean(profile?.is_verified);

    // =========================================================================
    // STATE A: PROFILE NOT SUBMITTED -> REGISTRATION FORM
    // =========================================================================
    if (!isProfileSubmitted) {
        return (
            <div className="p-4 max-w-4xl mx-auto space-y-8 pb-16">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
                        <Lock className="w-7 h-7" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-wider uppercase">
                        Creator Verification Required
                    </h1>
                    <p className="text-foreground/70 text-sm mt-2 leading-relaxed">
                        The Creator Dashboard is accessible only to creators who have submitted their profile for review. Submit your details below for verification by the Sample Lelo Team.
                    </p>
                </div>

                <Card className="glass-panel border-white/10 rounded-2xl shadow-xl">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="text-lg font-bold text-foreground tracking-wide flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Creator Profile Submission
                        </CardTitle>
                        <CardDescription className="text-xs text-foreground/50">
                            Tell us about your audience, social media reach, and content specializations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            {/* Profile Links */}
                            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-primary">
                                        Social Profile URLs / Handles <span className="text-red-500">*</span>
                                    </Label>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setFormData({...formData, profile_urls: [...formData.profile_urls, ""]})}
                                        className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                    >
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
                                            placeholder="e.g. https://instagram.com/yourhandle or https://youtube.com/@channel" 
                                            className="h-11 bg-white/5 border-white/10 text-sm text-foreground focus:border-primary/50"
                                        />
                                        {formData.profile_urls.length > 1 && (
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                className="border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/10 px-3 h-11 rounded-xl"
                                                onClick={() => {
                                                    const newUrls = formData.profile_urls.filter((_, i) => i !== idx);
                                                    setFormData({...formData, profile_urls: newUrls});
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Platforms */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                                    Primary Platforms <span className="text-red-500">*</span>
                                </Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {PLATFORMS.map(p => (
                                        <div 
                                            key={p} 
                                            className={`flex items-center space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                                                formData.platforms.includes(p) 
                                                    ? 'bg-primary/10 border-primary/40 text-primary' 
                                                    : 'bg-white/5 border-white/10 text-foreground/70 hover:bg-white/10'
                                            }`}
                                            onClick={() => handleCheckboxChange('platforms', p)}
                                        >
                                            <Checkbox 
                                                id={`plat-${p}`} 
                                                checked={formData.platforms.includes(p)}
                                                onCheckedChange={() => handleCheckboxChange('platforms', p)}
                                            />
                                            <Label htmlFor={`plat-${p}`} className="cursor-pointer text-xs font-medium">{p}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Follower Range / Tier */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                                    Follower Base / Creator Range <span className="text-red-500">*</span>
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {FOLLOWER_RANGES.map(r => (
                                        <div 
                                            key={r.value} 
                                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                                                formData.follower_range === r.value 
                                                    ? 'bg-primary/10 border-primary/40 text-primary' 
                                                    : 'bg-white/5 border-white/10 text-foreground/70 hover:bg-white/10'
                                            }`}
                                            onClick={() => setFormData({...formData, follower_range: r.value})}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <input 
                                                    type="radio" 
                                                    checked={formData.follower_range === r.value} 
                                                    readOnly 
                                                    className="w-4 h-4 accent-primary" 
                                                />
                                                <span className="text-xs font-medium">{r.label}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10">
                                                {r.tier}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Content Category & Exact Follower Count */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                                        Primary Content Category <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        className="h-11 w-full rounded-xl border border-white/10 bg-black/60 px-3 text-foreground text-xs font-sans outline-none focus:border-primary/50"
                                        value={formData.content_category}
                                        onChange={e => setFormData({...formData, content_category: e.target.value})}
                                        required
                                    >
                                        <option value="" disabled>Select category...</option>
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                                        Exact Follower Count (Approx)
                                    </Label>
                                    <Input 
                                        type="number"
                                        placeholder="e.g. 15000"
                                        value={formData.follower_count}
                                        onChange={e => setFormData({...formData, follower_count: e.target.value})}
                                        className="h-11 bg-white/5 border-white/10 text-xs text-foreground focus:border-primary/50"
                                    />
                                </div>
                            </div>

                            {/* Content Types & Collaboration Modes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                                        Content Formats
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {CONTENT_TYPES.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => handleCheckboxChange('content_types', c)}
                                                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                                    formData.content_types.includes(c) 
                                                        ? 'bg-primary/20 border-primary text-primary font-semibold' 
                                                        : 'bg-white/5 border-white/10 text-foreground/60'
                                                }`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                                        Preferred Collaboration
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLLABORATION_TYPES.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => handleCheckboxChange('collaboration_types', c)}
                                                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                                    formData.collaboration_types.includes(c) 
                                                        ? 'bg-primary/20 border-primary text-primary font-semibold' 
                                                        : 'bg-white/5 border-white/10 text-foreground/60'
                                                }`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Terms Notice */}
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs text-amber-300/90 flex items-start gap-3">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block text-amber-300 font-semibold mb-0.5">Verification & Approval Terms:</strong>
                                    Dashboard access and activity applications are subject to manual profile verification by the Sample Lelo Team. Applying for an activity does not guarantee selection, and Reel approval is required before payment.
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg"
                                disabled={isSaving}
                            >
                                {isSaving ? "Submitting Details..." : "Submit Profile for Verification"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // =========================================================================
    // STATE B: PROFILE SUBMITTED BUT PENDING VERIFICATION
    // =========================================================================
    if (!isVerified) {
        return (
            <div className="p-4 max-w-3xl mx-auto space-y-6 pb-16">
                <Card className="glass-panel border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent rounded-2xl p-8 text-center space-y-4 shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                        <Clock className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs px-3 py-1 uppercase tracking-wider mb-2">
                            Verification In Progress
                        </Badge>
                        <h2 className="text-2xl font-bold text-foreground tracking-wide">
                            Your Creator Profile is Under Review
                        </h2>
                        <p className="text-xs text-foreground/70 max-w-lg mx-auto mt-2 leading-relaxed">
                            Thank you for submitting your profile. The Sample Lelo Team is currently verifying your profile details, follower engagement, and content category. Dashboard access will be unlocked once verification is complete.
                        </p>
                    </div>

                    {/* Profile Summary Card */}
                    <div className="bg-black/40 border border-white/10 rounded-xl p-5 text-left text-xs space-y-3 max-w-lg mx-auto">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-foreground/50 uppercase tracking-wider text-[10px]">Category:</span>
                            <span className="font-semibold text-primary">{profile.content_category || "Unassigned"}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-foreground/50 uppercase tracking-wider text-[10px]">Follower Base:</span>
                            <span className="font-mono font-medium text-foreground">{profile.follower_count ? profile.follower_count.toLocaleString() : profile.follower_range}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-foreground/50 uppercase tracking-wider text-[10px]">Platforms:</span>
                            <span className="text-foreground">{profile.platforms?.join(", ")}</span>
                        </div>
                        <div>
                            <span className="text-foreground/50 uppercase tracking-wider text-[10px] block mb-1">Submitted Links:</span>
                            <div className="space-y-1">
                                {profile.profile_urls?.map((url: string, i: number) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-[11px] truncate">
                                        <ExternalLink className="w-3 h-3 shrink-0" /> {url}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                        <Button 
                            variant="outline" 
                            className="border-white/10 text-foreground hover:bg-white/5 text-xs h-10 rounded-xl"
                            onClick={() => fetchDashboard()}
                        >
                            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Check Verification Status
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="text-primary hover:bg-primary/10 text-xs h-10 rounded-xl"
                            onClick={() => {
                                // Reopen edit mode by resetting submitted status temporarily in state
                                setProfile({ ...profile, platforms: [] });
                            }}
                        >
                            Update Profile Details
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // =========================================================================
    // STATE C: VERIFIED CREATOR -> FULL DASHBOARD
    // =========================================================================
    const walletBalance = profile?.user?.wallet_balance || 0;
    
    // Group activities by user application status
    const appliedActivityIds = new Set(
        activities.filter(a => a.applications && a.applications.length > 0).map(a => a.id)
    );

    const availableActivities = activities.filter(a => !appliedActivityIds.has(a.id));
    const shortlistedActivities = activities.filter(a => 
        a.applications?.some((app: any) => app.status === 'SHORTLISTED' || app.status === 'CORRECTION_REQUIRED')
    );
    const submittedActivities = activities.filter(a => 
        a.applications?.some((app: any) => app.status === 'SUBMITTED')
    );
    const approvedActivities = activities.filter(a => 
        a.applications?.some((app: any) => app.status === 'APPROVED')
    );

    // Calculate total earned
    const totalEarned = approvedActivities.reduce((sum, a) => sum + (a.reward_amount || 0), 0);

    return (
        <div className="space-y-8 relative z-10 pb-16">
            {/* Header with Verification & Tier Badges */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-extrabold text-primary tracking-wider uppercase">
                            Creator Dashboard
                        </h1>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs px-2.5 py-0.5 flex items-center gap-1 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Creator
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-foreground/80 font-mono">
                            {profile.category_tier || "Micro Creator"}
                        </Badge>
                    </div>
                    <p className="text-foreground/60 mt-1 text-xs font-sans tracking-wide">
                        Welcome back, <strong className="text-white">{profile.user?.name || "Creator"}</strong> • Category: <span className="text-primary">{profile.content_category || "General"}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => setIsRedeemOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 px-4 rounded-xl flex items-center gap-2 shadow-md"
                    >
                        <Wallet className="w-4 h-4" /> Redeem Wallet
                    </Button>
                </div>
            </div>

            {/* Notifications & Shortlist Alert Center */}
            {notifications.length > 0 && notifications.some(n => n.title?.includes("Shortlisted") || n.message?.includes("shortlisted")) && (
                <div className="bg-gradient-to-r from-blue-600/20 via-blue-600/10 to-transparent border border-blue-500/30 p-4 rounded-2xl flex items-start gap-3.5 shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400">
                        <Sparkles className="w-5 h-5 animate-spin" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-blue-300 text-sm tracking-wide">
                            Activity Selection Alert
                        </h3>
                        <p className="text-foreground/80 text-xs mt-0.5 leading-relaxed">
                            {notifications.find(n => n.title?.includes("Shortlisted") || n.message?.includes("shortlisted"))?.message || 
                             "Congratulations! You have been shortlisted for this activity. Please complete the required activity and submit your Reel link through the Creator Dashboard."}
                        </p>
                    </div>
                </div>
            )}

            {/* Wallet & Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Available Balance */}
                <Card className="glass-panel border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                            Available Balance
                        </span>
                        <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-extrabold font-mono text-emerald-300">
                            ₹{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[11px] text-foreground/50 mt-1">
                            UPI: {profile.user?.upi_id || "Not configured"}
                        </p>
                    </div>
                </Card>

                {/* Total Lifetime Earnings */}
                <Card className="glass-panel border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">
                            Approved Earnings
                        </span>
                        <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-extrabold font-mono text-primary">
                            ₹{totalEarned.toLocaleString()}
                        </div>
                        <p className="text-[11px] text-foreground/50 mt-1">
                            {approvedActivities.length} Approved Reels
                        </p>
                    </div>
                </Card>

                {/* Shortlisted In-Progress */}
                <Card 
                    className="glass-panel border-blue-500/20 p-5 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-blue-500/40 transition-all"
                    onClick={() => setActiveTab("shortlisted")}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                            Shortlisted Activities
                        </span>
                        <Video className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-extrabold font-mono text-blue-300">
                            {shortlistedActivities.length}
                        </div>
                        <p className="text-[11px] text-foreground/50 mt-1">
                            Reel submissions required
                        </p>
                    </div>
                </Card>

                {/* Open Activities */}
                <Card 
                    className="glass-panel border-white/10 p-5 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-all"
                    onClick={() => setActiveTab("available")}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">
                            Available Campaigns
                        </span>
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-extrabold font-mono text-foreground">
                            {availableActivities.length}
                        </div>
                        <p className="text-[11px] text-foreground/50 mt-1">
                            Open for application
                        </p>
                    </div>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-1 overflow-x-auto text-xs">
                <button
                    onClick={() => setActiveTab("available")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                        activeTab === "available" 
                            ? "bg-primary text-black font-bold shadow-md" 
                            : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                    }`}
                >
                    Available Activities ({availableActivities.length})
                </button>
                <button
                    onClick={() => setActiveTab("shortlisted")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === "shortlisted" 
                            ? "bg-blue-600 text-white font-bold shadow-md" 
                            : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                    }`}
                >
                    Shortlisted & Submit Reel ({shortlistedActivities.length})
                    {shortlistedActivities.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("submitted")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                        activeTab === "submitted" 
                            ? "bg-amber-500 text-black font-bold shadow-md" 
                            : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                    }`}
                >
                    Reels Under Review ({submittedActivities.length})
                </button>
                <button
                    onClick={() => setActiveTab("approved")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                        activeTab === "approved" 
                            ? "bg-emerald-600 text-white font-bold shadow-md" 
                            : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                    }`}
                >
                    Approved & Paid ({approvedActivities.length})
                </button>
            </div>

            {/* ============================================================= */}
            {/* TAB 1: AVAILABLE ACTIVITIES                                   */}
            {/* ============================================================= */}
            {activeTab === "available" && (
                <div className="space-y-4">
                    {availableActivities.length === 0 ? (
                        <Card className="p-12 text-center glass-panel border-white/10 rounded-2xl">
                            <Video className="w-10 h-10 text-foreground/30 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-foreground">No new activities available right now</h3>
                            <p className="text-xs text-foreground/50 mt-1 max-w-md mx-auto">
                                Check back regularly or review your shortlisted activities. New campaigns are published regularly by our brand partners.
                            </p>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {availableActivities.map(activity => (
                                <Card key={activity.id} className="glass-panel border-white/10 hover:border-primary/40 transition-all rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg">
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono uppercase tracking-wider">
                                                Creator Collab
                                            </Badge>
                                            <span className="text-emerald-400 font-mono font-extrabold text-sm">
                                                ₹{activity.reward_amount} Reward
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-base text-foreground leading-snug">
                                            {activity.title}
                                        </h3>

                                        <p className="text-xs text-foreground/60 line-clamp-3 leading-relaxed">
                                            {activity.description}
                                        </p>

                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs space-y-1">
                                            <span className="font-semibold text-foreground/80 block uppercase tracking-wider text-[10px]">
                                                Requirements:
                                            </span>
                                            <p className="text-foreground/60 text-[11px] leading-relaxed line-clamp-3">
                                                {activity.requirements}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-5 pt-0">
                                        <Button 
                                            className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wider text-xs h-10 rounded-xl"
                                            onClick={() => handleApply(activity.id)}
                                        >
                                            Apply for Activity
                                        </Button>
                                        <p className="text-[10px] text-foreground/40 text-center mt-1.5">
                                            Applying does not guarantee selection.
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================= */}
            {/* TAB 2: SHORTLISTED & REEL SUBMISSION                          */}
            {/* ============================================================= */}
            {activeTab === "shortlisted" && (
                <div className="space-y-4">
                    {shortlistedActivities.length === 0 ? (
                        <Card className="p-12 text-center glass-panel border-white/10 rounded-2xl">
                            <Clock className="w-10 h-10 text-foreground/30 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-foreground">No shortlisted activities at this time</h3>
                            <p className="text-xs text-foreground/50 mt-1 max-w-md mx-auto">
                                Once the Sample Lelo Team reviews your applications and shortlists your profile, activities will appear here for Reel submission.
                            </p>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            {shortlistedActivities.map(activity => {
                                const myApp = activity.applications[0];
                                const isCorrection = myApp?.status === 'CORRECTION_REQUIRED';
                                return (
                                    <Card key={activity.id} className="glass-panel border-blue-500/30 bg-blue-500/5 rounded-2xl p-6 space-y-4 shadow-xl">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] uppercase tracking-wider mb-1.5">
                                                    {isCorrection ? "Correction Required" : "Shortlisted"}
                                                </Badge>
                                                <h3 className="font-bold text-lg text-foreground">{activity.title}</h3>
                                            </div>
                                            <span className="text-emerald-400 font-mono font-extrabold text-base shrink-0">
                                                ₹{activity.reward_amount}
                                            </span>
                                        </div>

                                        {/* Shortlisting Congratulatory Callout */}
                                        <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-xl text-xs text-blue-200 leading-relaxed">
                                            <strong className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-400" /> Congratulations!</strong> You have been shortlisted for this activity. Please complete the required activity and submit your Reel link through the Creator Dashboard below.
                                        </div>

                                        <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-xs space-y-1">
                                            <span className="text-foreground/50 font-semibold uppercase text-[10px] tracking-wider block">
                                                Campaign Deliverables:
                                            </span>
                                            <p className="text-foreground/80 leading-relaxed text-[11px]">
                                                {activity.requirements}
                                            </p>
                                        </div>

                                        {/* Reel submission input form */}
                                        <form onSubmit={handleSubmitReel} className="space-y-3 pt-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-primary">
                                                Submit Your Live Reel / Short Link:
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    placeholder="https://www.instagram.com/reel/C... or YouTube Short"
                                                    value={selectedAppId === myApp.id ? reelLink : ""}
                                                    onChange={e => {
                                                        setSelectedAppId(myApp.id);
                                                        setReelLink(e.target.value);
                                                    }}
                                                    className="h-11 bg-black/60 border-white/15 text-xs text-foreground focus:border-primary/50"
                                                    required
                                                />
                                                <Button 
                                                    type="submit" 
                                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-11 px-5 rounded-xl shrink-0"
                                                    disabled={isSubmittingReel || !reelLink.trim() || selectedAppId !== myApp.id}
                                                >
                                                    {isSubmittingReel && selectedAppId === myApp.id ? "Submitting..." : "Submit Reel"}
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-foreground/40">
                                                Ensure your post is public and includes all mandatory tags and hashtags.
                                            </p>
                                        </form>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================= */}
            {/* TAB 3: REELS UNDER REVIEW                                     */}
            {/* ============================================================= */}
            {activeTab === "submitted" && (
                <div className="space-y-4">
                    {submittedActivities.length === 0 ? (
                        <Card className="p-12 text-center glass-panel border-white/10 rounded-2xl">
                            <Video className="w-10 h-10 text-foreground/30 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-foreground">No Reels currently pending review</h3>
                            <p className="text-xs text-foreground/50 mt-1 max-w-md mx-auto">
                                Once you submit a Reel link for a shortlisted campaign, our review team validates the deliverables before releasing payment.
                            </p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {submittedActivities.map(activity => {
                                const myApp = activity.applications[0];
                                return (
                                    <Card key={activity.id} className="glass-panel border-amber-500/20 bg-amber-500/5 rounded-2xl p-6 space-y-3 shadow-md">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] uppercase tracking-wider mb-1">
                                                    Reel Under Review
                                                </Badge>
                                                <h3 className="font-bold text-base text-foreground">{activity.title}</h3>
                                            </div>
                                            <span className="text-emerald-400 font-mono font-bold text-sm">
                                                ₹{activity.reward_amount}
                                            </span>
                                        </div>

                                        <p className="text-xs text-foreground/70">
                                            Submitted Reel Link:
                                        </p>
                                        <a 
                                            href={myApp.reel_link} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-xs text-primary hover:underline flex items-center gap-1.5 font-mono break-all bg-black/40 p-2.5 rounded-lg border border-white/5"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {myApp.reel_link}
                                        </a>

                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-[11px] text-foreground/60 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                            <span>
                                                The Sample Lelo Team is reviewing your Reel against guidelines. Approved Reel payments will be processed within 15 days of approval.
                                            </span>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: APPROVED & PAID                                        */}
            {/* ============================================================= */}
            {activeTab === "approved" && (
                <div className="space-y-4">
                    {approvedActivities.length === 0 ? (
                        <Card className="p-12 text-center glass-panel border-white/10 rounded-2xl">
                            <CheckCircle2 className="w-10 h-10 text-foreground/30 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-foreground">No approved campaigns yet</h3>
                            <p className="text-xs text-foreground/50 mt-1 max-w-md mx-auto">
                                Complete your shortlisted activities to earn rewards credited straight into your Creator Wallet!
                            </p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {approvedActivities.map(activity => {
                                const myApp = activity.applications[0];
                                return (
                                    <Card key={activity.id} className="glass-panel border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-6 space-y-3 shadow-md">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 w-fit">
                                                    <CheckCircle2 className="w-3 h-3" /> Approved & Credited
                                                </Badge>
                                                <h3 className="font-bold text-base text-foreground">{activity.title}</h3>
                                            </div>
                                            <span className="text-emerald-400 font-mono font-extrabold text-lg">
                                                +₹{activity.reward_amount}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-foreground/60">
                                            Approved On: {myApp.approved_at ? new Date(myApp.approved_at).toLocaleDateString() : "Verified"}
                                        </p>

                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-300/90 leading-relaxed">
                                            ₹{activity.reward_amount} credited to your Creator Wallet balance. Ready for UPI redemption at any time.
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================= */}
            {/* WALLET REDEMPTION MODAL                                       */}
            {/* ============================================================= */}
            <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
                <DialogContent className="max-w-md bg-neutral-900 border-white/10 p-6 rounded-2xl text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-primary font-bold text-xl flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-400" />
                            Redeem Creator Wallet
                        </DialogTitle>
                        <DialogDescription className="text-foreground/50 text-xs">
                            Transfer your earnings directly to your bank account via UPI.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRedeemWallet} className="space-y-4 pt-3">
                        <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 flex justify-between items-center">
                            <span className="text-xs text-foreground/60">Available Balance:</span>
                            <span className="text-lg font-mono font-bold text-emerald-400">
                                ₹{walletBalance.toFixed(2)}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                                    Redeem Amount (₹)
                                </Label>
                                <button 
                                    type="button" 
                                    className="text-[11px] text-primary hover:underline"
                                    onClick={() => setRedeemAmount(walletBalance.toString())}
                                >
                                    Redeem Max
                                </button>
                            </div>
                            <Input 
                                type="number" 
                                min="10" 
                                max={walletBalance} 
                                step="any"
                                placeholder="Enter amount to withdraw" 
                                value={redeemAmount}
                                onChange={e => setRedeemAmount(e.target.value)}
                                className="h-11 bg-black/60 border-white/15 text-foreground text-sm rounded-xl focus:border-primary/50"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                                Virtual Payment Address (UPI ID)
                            </Label>
                            <Input 
                                placeholder="e.g. yourname@okhdfcbank" 
                                value={upiId}
                                onChange={e => setUpiId(e.target.value)}
                                className="h-11 bg-black/60 border-white/15 text-foreground text-sm rounded-xl focus:border-primary/50"
                                required
                            />
                            <p className="text-[10px] text-foreground/40">
                                Payout will be transferred directly to this UPI address.
                            </p>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="flex-1 border-white/10 text-xs h-11 rounded-xl"
                                onClick={() => setIsRedeemOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-11 rounded-xl shadow-md"
                                disabled={isRedeeming || walletBalance <= 0}
                            >
                                {isRedeeming ? "Processing..." : "Confirm Payout"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ============================================================= */}
            {/* IMPORTANT COMPLIANCE & TERMS NOTICE                           */}
            {/* ============================================================= */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-foreground/60 space-y-2">
                <div className="flex items-center gap-2 text-foreground/90 font-bold text-xs uppercase tracking-wider">
                    <Info className="w-4 h-4 text-primary" />
                    Important Creator Guidelines & Terms
                </div>
                <p className="leading-relaxed">
                    Creator Dashboard access, activity selection, shortlisting, Reel approval, and payment are subject to profile verification, activity requirements, content guidelines, and successful validation by the Sample Lelo Team.
                </p>
                <p className="leading-relaxed">
                    Submitting an application does not guarantee selection, and completing an activity does not guarantee payment unless the submitted content successfully passes the required approval and verification process. Approved Reel payments are credited within 15 days of Reel approval.
                </p>
            </div>
        </div>
    );
}

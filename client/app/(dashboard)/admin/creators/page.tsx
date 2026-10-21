"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ExternalLink, ShieldCheck, Search, Users, Award, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

const CREATOR_TIERS = [
    "Nano Creator (500 - 5K)",
    "Micro Creator (5K - 25K)",
    "Mid-Tier Creator (25K - 100K)",
    "Macro Creator (100K+)",
    "Elite Creator"
];

export default function AdminCreatorsPage() {
    const [creators, setCreators] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "VERIFIED">("ALL");
    const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchCreators();
    }, []);

    const fetchCreators = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/admin/creators");
            if (res.ok) {
                const data = await res.json();
                setCreators(data);
                
                // Initialize tier mappings
                const tiers: Record<string, string> = {};
                data.forEach((c: any) => {
                    tiers[c.id] = c.creator_profile?.category_tier || getDefaultTier(c.creator_profile?.follower_count);
                });
                setSelectedTiers(tiers);
            }
        } catch (error) {
            toast.error("Failed to load creator list.");
        } finally {
            setIsLoading(false);
        }
    };

    const getDefaultTier = (count?: number) => {
        if (!count) return "Micro Creator (5K - 25K)";
        if (count >= 100000) return "Macro Creator (100K+)";
        if (count >= 25000) return "Mid-Tier Creator (25K - 100K)";
        if (count >= 5000) return "Micro Creator (5K - 25K)";
        return "Nano Creator (500 - 5K)";
    };

    const handleVerify = async (id: string, isVerified: boolean) => {
        try {
            const tier = selectedTiers[id] || "Micro Creator (5K - 25K)";
            const res = await apiFetch(`/api/admin/creators/${id}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_verified: isVerified, category_tier: tier })
            });

            if (res.ok) {
                toast.success(isVerified ? `Creator verified as ${tier}` : "Creator verification revoked");
                fetchCreators();
            } else {
                toast.error("Failed to update creator status");
            }
        } catch (error) {
            toast.error("An error occurred during verification");
        }
    };

    const filteredCreators = creators.filter(c => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
            c.name?.toLowerCase().includes(query) || 
            c.email?.toLowerCase().includes(query) ||
            c.mobile?.includes(query) ||
            c.creator_profile?.content_category?.toLowerCase().includes(query);

        if (filterStatus === "VERIFIED") return matchesSearch && c.creator_profile?.is_verified;
        if (filterStatus === "PENDING") return matchesSearch && !c.creator_profile?.is_verified;
        return matchesSearch;
    });

    const pendingCount = creators.filter(c => !c.creator_profile?.is_verified).length;
    const verifiedCount = creators.filter(c => c.creator_profile?.is_verified).length;

    return (
        <div className="space-y-8 relative z-10 pb-16">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-wider uppercase">
                        Creator Profile Verification
                    </h1>
                    <p className="text-sm font-sans tracking-wide text-foreground/50 mt-1">
                        Review, categorize, and verify creator submissions before granting dashboard access.
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchCreators}
                    className="border-primary/40 text-primary hover:bg-primary/10 tracking-wider uppercase text-xs rounded-lg h-10 px-4"
                >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh List
                </Button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="glass-panel border-white/5 p-4 rounded-xl">
                    <span className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">Total Creators</span>
                    <div className="text-2xl font-bold font-mono text-primary mt-1">{creators.length}</div>
                </Card>
                <Card className="glass-panel border-amber-500/20 bg-amber-500/5 p-4 rounded-xl">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Pending Verification</span>
                    <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{pendingCount}</div>
                </Card>
                <Card className="glass-panel border-emerald-500/20 bg-emerald-500/5 p-4 rounded-xl">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Verified Creators</span>
                    <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{verifiedCount}</div>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card className="glass-panel border-white/5 rounded-2xl p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input 
                            placeholder="Search creator by name, mobile, email, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 bg-white/5 border-white/10 text-xs text-foreground placeholder:text-foreground/40 rounded-xl"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                            variant={filterStatus === "ALL" ? "default" : "outline"} 
                            onClick={() => setFilterStatus("ALL")} 
                            size="sm"
                            className="text-xs h-9 px-3 rounded-lg"
                        >
                            All ({creators.length})
                        </Button>
                        <Button 
                            variant={filterStatus === "PENDING" ? "default" : "outline"} 
                            onClick={() => setFilterStatus("PENDING")} 
                            size="sm"
                            className="text-xs h-9 px-3 rounded-lg text-amber-400 border-amber-500/30"
                        >
                            Pending Review ({pendingCount})
                        </Button>
                        <Button 
                            variant={filterStatus === "VERIFIED" ? "default" : "outline"} 
                            onClick={() => setFilterStatus("VERIFIED")} 
                            size="sm"
                            className="text-xs h-9 px-3 rounded-lg text-emerald-400 border-emerald-500/30"
                        >
                            Verified ({verifiedCount})
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Creators Table */}
            <Card className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow-xl">
                {isLoading ? (
                    <div className="p-16 text-center text-xs text-foreground/50 animate-pulse">Loading creator records...</div>
                ) : filteredCreators.length === 0 ? (
                    <div className="p-16 text-center text-xs text-foreground/50">No creator profiles match your filters.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-xs font-semibold text-foreground/70">Creator Profile</TableHead>
                                    <TableHead className="text-xs font-semibold text-foreground/70">Category & Audience</TableHead>
                                    <TableHead className="text-xs font-semibold text-foreground/70">Social Links</TableHead>
                                    <TableHead className="text-xs font-semibold text-foreground/70">Assign Creator Range / Tier</TableHead>
                                    <TableHead className="text-xs font-semibold text-foreground/70">Status</TableHead>
                                    <TableHead className="text-right text-xs font-semibold text-foreground/70">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCreators.map(creator => {
                                    const prof = creator.creator_profile;
                                    const isVerified = Boolean(prof?.is_verified);
                                    const creatorTier = selectedTiers[creator.id] || prof?.category_tier || "Micro Creator (5K - 25K)";

                                    return (
                                        <TableRow key={creator.id} className="border-white/5 hover:bg-white/5">
                                            <TableCell>
                                                <div className="font-bold text-sm text-foreground">{creator.name}</div>
                                                <div className="text-xs text-foreground/60">{creator.mobile}</div>
                                                <div className="text-xs text-foreground/50">{creator.email || "No email"}</div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                                        {prof?.content_category || "General"}
                                                    </Badge>
                                                    <div className="text-xs text-foreground/70 font-mono">
                                                        Followers: <strong className="text-foreground">{prof?.follower_count ? prof.follower_count.toLocaleString() : (prof?.follower_range || "N/A")}</strong>
                                                    </div>
                                                    {prof?.engagement_rate ? (
                                                        <div className="text-[11px] text-foreground/50 font-mono">
                                                            Engagement: {prof.engagement_rate}%
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {prof?.profile_urls && prof.profile_urls.length > 0 ? (
                                                    <div className="space-y-1 max-w-[200px]">
                                                        {prof.profile_urls.map((url: string, i: number) => (
                                                            <a 
                                                                key={i} 
                                                                href={url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="text-primary hover:underline text-xs flex items-center gap-1 truncate"
                                                            >
                                                                <ExternalLink className="w-3 h-3 shrink-0" /> {url}
                                                            </a>
                                                        ))}
                                                        {prof.platforms?.length > 0 && (
                                                            <div className="text-[10px] text-foreground/40 mt-1">
                                                                Platforms: {prof.platforms.join(", ")}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-foreground/40 italic">No links submitted</span>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <select
                                                    className="h-9 rounded-lg border border-white/10 bg-black/60 px-2.5 text-foreground text-xs font-sans outline-none focus:border-primary/50"
                                                    value={creatorTier}
                                                    disabled={isVerified}
                                                    onChange={e => setSelectedTiers({ ...selectedTiers, [creator.id]: e.target.value })}
                                                >
                                                    {CREATOR_TIERS.map(tier => (
                                                        <option key={tier} value={tier}>{tier}</option>
                                                    ))}
                                                </select>
                                            </TableCell>

                                            <TableCell>
                                                {isVerified ? (
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs px-2.5 py-0.5 flex items-center gap-1 w-fit">
                                                        <CheckCircle className="w-3 h-3" /> Verified
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-2.5 py-0.5 flex items-center gap-1 w-fit">
                                                        <XCircle className="w-3 h-3" /> Pending Review
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                {!isVerified ? (
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-4 rounded-lg shadow-sm"
                                                        onClick={() => handleVerify(creator.id, true)}
                                                    >
                                                        Verify Creator
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/10 text-xs h-8 px-3 rounded-lg"
                                                        onClick={() => handleVerify(creator.id, false)}
                                                    >
                                                        Revoke
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
}

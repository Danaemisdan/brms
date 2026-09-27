"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminCreatorsPage() {
    const [creators, setCreators] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");

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
            }
        } catch (error) {
            toast.error("Failed to load creators");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (id: string, isVerified: boolean, tier: string) => {
        try {
            const res = await apiFetch(`/api/admin/creators/${id}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_verified: isVerified, category_tier: tier })
            });

            if (res.ok) {
                toast.success(isVerified ? "Creator verified" : "Creator unverified");
                fetchCreators();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const filteredCreators = creators.filter(c => {
        const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.email?.toLowerCase().includes(searchQuery.toLowerCase());
        if (filterStatus === "VERIFIED") return matchesSearch && c.creator_profile?.is_verified;
        if (filterStatus === "PENDING") return matchesSearch && !c.creator_profile?.is_verified;
        return matchesSearch;
    });

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Creator Verification</h1>
            <p className="text-muted-foreground">Review and verify creator profiles before they can access the platform.</p>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            className="flex h-10 w-full md:max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button variant={filterStatus === "ALL" ? "default" : "outline"} onClick={() => setFilterStatus("ALL")} size="sm">All</Button>
                            <Button variant={filterStatus === "PENDING" ? "default" : "outline"} onClick={() => setFilterStatus("PENDING")} size="sm">Pending</Button>
                            <Button variant={filterStatus === "VERIFIED" ? "default" : "outline"} onClick={() => setFilterStatus("VERIFIED")} size="sm">Verified</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
                    ) : filteredCreators.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground">No creators found.</div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Creator Details</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Stats</TableHead>
                                        <TableHead>Links</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCreators.map(creator => {
                                        const profile = creator.creator_profile;
                                        return (
                                            <TableRow key={creator.id}>
                                                <TableCell>
                                                    <div className="font-semibold">{creator.name}</div>
                                                    <div className="text-xs text-muted-foreground">{creator.mobile}</div>
                                                    <div className="text-xs text-muted-foreground">{creator.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {profile?.content_category ? (
                                                        <Badge variant="secondary">{profile.content_category}</Badge>
                                                    ) : <span className="text-xs text-muted-foreground">N/A</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {profile ? (
                                                        <div className="text-xs space-y-1">
                                                            <div><span className="text-muted-foreground">Followers:</span> {profile.follower_count.toLocaleString()}</div>
                                                            <div><span className="text-muted-foreground">Engagement:</span> {profile.engagement_rate}%</div>
                                                        </div>
                                                    ) : <span className="text-xs text-muted-foreground">N/A</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {profile?.profile_urls && profile.profile_urls.length > 0 ? (
                                                        <div className="flex flex-col gap-1">
                                                            {profile.profile_urls.map((url: string, idx: number) => (
                                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline truncate max-w-[150px]">
                                                                    Link {idx + 1}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-xs text-muted-foreground">None</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {profile?.is_verified ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1"/> Verified</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50"><XCircle className="w-3 h-3 mr-1"/> Pending</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!profile?.is_verified ? (
                                                        <Button size="sm" onClick={() => handleVerify(creator.id, true, "Standard")}>Verify</Button>
                                                    ) : (
                                                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleVerify(creator.id, false, "")}>Revoke</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

export default function AdminCreatorsPage() {
    const [creators, setCreators] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Creator Verification</h1>
            <p className="text-muted-foreground">Review and verify creator profiles before they can access the platform.</p>

            {isLoading ? (
                <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : creators.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-lg border">No creators registered yet.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {creators.map(creator => {
                        const profile = creator.creator_profile;
                        return (
                            <Card key={creator.id} className={`overflow-hidden border-2 ${profile?.is_verified ? 'border-green-100' : 'border-yellow-100'}`}>
                                <CardHeader className="pb-2 bg-gray-50 border-b">
                                    <CardTitle className="text-xl">{creator.name}</CardTitle>
                                    <p className="text-sm text-gray-500">{creator.mobile} {creator.email && `| ${creator.email}`}</p>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {profile ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="font-semibold">Category:</div>
                                                <div>{profile.content_category || 'N/A'}</div>
                                                <div className="font-semibold">Followers:</div>
                                                <div>{profile.follower_count.toLocaleString()}</div>
                                                <div className="font-semibold">Engagement:</div>
                                                <div>{profile.engagement_rate}%</div>
                                            </div>
                                            {profile.profile_url && (
                                                <a href={profile.profile_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                    View Profile Link
                                                </a>
                                            )}
                                            <div className="pt-4 border-t flex justify-between items-center">
                                                {profile.is_verified ? (
                                                    <span className="text-green-600 flex items-center text-sm font-semibold"><CheckCircle className="w-4 h-4 mr-1"/> Verified ({profile.category_tier})</span>
                                                ) : (
                                                    <span className="text-yellow-600 flex items-center text-sm font-semibold"><XCircle className="w-4 h-4 mr-1"/> Pending</span>
                                                )}
                                                
                                                {!profile.is_verified ? (
                                                    <Button size="sm" onClick={() => handleVerify(creator.id, true, "Standard")}>Verify</Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => handleVerify(creator.id, false, "")}>Revoke</Button>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-4">Profile not set up yet</div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

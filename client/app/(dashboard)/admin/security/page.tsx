"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, QrCode } from "lucide-react";
import Image from "next/image";

const API_URL = "";

export default function AdminSecurity() {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError("");
        
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/auth/2fa/generate`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            const data = await res.json();
            if (res.ok) {
                setQrCode(data.qrCodeDataUrl);
                setSecret(data.secret);
            } else {
                setError(data.error || "Failed to generate 2FA");
            }
        } catch (error) {
            setError("Server error generating 2FA.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length !== 6) {
            setError("Please enter a valid 6-digit code.");
            return;
        }

        setIsVerifying(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/auth/2fa/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ code })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("2FA Successfully Enabled!");
                setIsSetupComplete(true);
                setQrCode(null);
                setSecret(null);
            } else {
                setError(data.error || "Invalid 2FA code");
            }
        } catch (error) {
            setError("Server error verifying 2FA.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="space-y-8 relative z-10 max-w-3xl pb-16">
            <div className="flex items-center justify-between border-b border-border/60 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Security & 2FA</h1>
                    <p className="text-muted-foreground mt-1.5 font-sans tracking-wide text-xs sm:text-sm">Secure your administrator account with two-factor authentication.</p>
                </div>
            </div>

            <Card className="bg-card/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs">
                <CardHeader className="border-b border-border/40 pb-4 mb-6">
                    <CardTitle className="text-lg font-sans font-bold text-foreground tracking-tight flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        Authenticator App Setup
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isSetupComplete ? (
                        <div className="text-center py-12 space-y-4">
                            <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto" />
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">2FA Enabled</h2>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto">Your account is now secured with two-factor authentication. You will be required to enter a code on your next login.</p>
                        </div>
                    ) : !qrCode ? (
                        <div className="space-y-6">
                            <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                                Two-factor authentication adds an extra layer of security to your account. Once configured, you&apos;ll be required to enter both your password and an authentication code from your mobile app (like Google Authenticator or Authy) to sign in.
                            </p>
                            {error && <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/20 font-sans tracking-wide">{error}</div>}
                            <Button onClick={handleGenerate} disabled={isGenerating} className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs h-11 px-6 rounded-xl shadow-xs transition-all">
                                {isGenerating ? "Initializing..." : "Begin 2FA Setup"}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold tracking-tight text-sm mb-1.5 text-foreground">Step 1: Scan QR Code</h3>
                                    <p className="text-xs text-muted-foreground tracking-wide leading-relaxed">Open your authenticator app and scan the barcode to the right. If you can&apos;t scan it, enter the manual code below.</p>
                                </div>
                                <div className="p-4 bg-muted/40 border border-border/60 rounded-xl">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Manual Setup Key</p>
                                    <code className="text-foreground font-mono tracking-widest select-all font-semibold">{secret}</code>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-2xl max-w-fit mx-auto shadow-md border border-border/40">
                                    <img src={qrCode} alt="2FA QR Code" width={200} height={200} className="w-48 h-48" />
                                </div>
                                <form onSubmit={handleVerify} className="space-y-4 pt-4 border-t border-border/40">
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="text-muted-foreground text-xs font-medium">Step 2: Enter 6-digit Code</Label>
                                        <Input
                                            id="code"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            placeholder="000000"
                                            maxLength={6}
                                            required
                                            className="h-12 bg-background border-border text-foreground font-mono text-xl tracking-[0.5em] text-center rounded-xl"
                                        />
                                    </div>
                                    {error && <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/20 font-sans tracking-wide text-center">{error}</div>}
                                    <Button type="submit" disabled={isVerifying || code.length !== 6} className="w-full bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-medium text-xs h-11 rounded-xl shadow-xs transition-all">
                                        {isVerifying ? "Verifying..." : "Verify & Enable 2FA"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

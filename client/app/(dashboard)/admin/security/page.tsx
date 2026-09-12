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
        <div className="space-y-10 relative z-10 max-w-3xl">
            <div className="flex items-center justify-between border-b border-border/5 pb-6">
                <div>
                    <h1 className="text-4xl font-sans font-bold text-primary tracking-wider uppercase">Security & 2FA</h1>
                    <p className="text-foreground/40 mt-2 font-sans tracking-wide text-sm">Secure your administrator account with two-factor authentication.</p>
                </div>
            </div>

            <Card className="glass-panel border-primary/20 shadow-[0_0_30px_rgba(235,87,87,0.05)]">
                <CardHeader className="border-b border-border/5 pb-4 mb-6">
                    <CardTitle className="text-xl font-sans font-bold text-foreground tracking-widest uppercase flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        Authenticator App Setup
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isSetupComplete ? (
                        <div className="text-center py-12 space-y-4">
                            <ShieldCheck className="w-16 h-16 text-green-500 mx-auto" />
                            <h2 className="text-2xl font-bold tracking-widest uppercase text-green-500">2FA Enabled</h2>
                            <p className="text-foreground/60 tracking-wide">Your account is now secured with two-factor authentication. You will be required to enter a code on your next login.</p>
                        </div>
                    ) : !qrCode ? (
                        <div className="space-y-6">
                            <p className="text-foreground/70 font-sans tracking-wide text-sm leading-relaxed">
                                Two-factor authentication adds an extra layer of security to your account. Once configured, you'll be required to enter both your password and an authentication code from your mobile app (like Google Authenticator or Authy) to sign in.
                            </p>
                            {error && <div className="p-3 rounded bg-red-900/20 text-red-400 text-xs border border-red-500/50 font-sans tracking-wider uppercase">{error}</div>}
                            <Button onClick={handleGenerate} disabled={isGenerating} className="bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 font-sans tracking-widest uppercase text-xs h-12 px-6 rounded-sm transition-all">
                                {isGenerating ? "Initializing..." : "Begin 2FA Setup"}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold tracking-widest uppercase text-sm mb-2 text-foreground/80">Step 1: Scan QR Code</h3>
                                    <p className="text-xs text-foreground/60 tracking-wide leading-relaxed">Open your authenticator app and scan the barcode to the right. If you can't scan it, enter the manual code below.</p>
                                </div>
                                <div className="p-4 bg-foreground/5 border border-border/10 rounded-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-foreground/50 mb-1">Manual Setup Key</p>
                                    <code className="text-primary font-mono tracking-widest select-all">{secret}</code>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-sm max-w-fit mx-auto shadow-xl">
                                    <img src={qrCode} alt="2FA QR Code" width={200} height={200} className="w-48 h-48" />
                                </div>
                                <form onSubmit={handleVerify} className="space-y-4 pt-4 border-t border-border/10">
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="text-foreground/60 uppercase tracking-widest text-[10px]">Step 2: Enter 6-digit Code</Label>
                                        <Input
                                            id="code"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            placeholder="000000"
                                            maxLength={6}
                                            required
                                            className="h-14 bg-white/5 border-border/10 text-foreground focus:border-primary/50 font-mono text-xl tracking-[0.5em] text-center"
                                        />
                                    </div>
                                    {error && <div className="p-3 rounded bg-red-900/20 text-red-400 text-xs border border-red-500/50 font-sans tracking-wider uppercase text-center">{error}</div>}
                                    <Button type="submit" disabled={isVerifying || code.length !== 6} className="w-full bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 font-sans tracking-widest uppercase text-xs h-14 rounded-sm transition-all">
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

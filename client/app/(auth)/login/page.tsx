"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <LoginComponent />
        </Suspense>
    );
}


function LoginComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get("returnUrl");
    const resetToken = searchParams.get("reset_token");
    
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Auto-redirect if already logged in OR clear token if returning from a strict guarded route
    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (returnUrl) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("name");
            return;
        }

        if (token && role && !resetToken) {
            const upperRole = role.toUpperCase();
            if (upperRole === "ADMIN") router.push("/admin");
            else if (upperRole === "VENDOR") router.push("/brand");
            else router.push("/customer");
        }
    }, [router, returnUrl, resetToken]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const data = await api.post("/auth/login", { identifier, password }, { requiresAuth: false });
            
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.user.role.toUpperCase());
                localStorage.setItem("name", data.user.name);
            }

            if (returnUrl) {
                router.push(returnUrl);
                return;
            }

            const role = data.user.role.toLowerCase();
            if (role === "admin") router.push("/admin");
            else if (role === "vendor") router.push("/brand");
            else router.push("/customer");
        } catch {
            setError("Cannot connect to server. Make sure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setIsLoading(true);
        try {
            const data = await api.post("/auth/forgot-password", { email: forgotEmail }, { requiresAuth: false });
            setSuccessMsg("If that email exists, a reset link has been sent to it.");
            setForgotEmail("");
        } catch {
            setError("Network error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setError("");
        setSuccessMsg("");
        setIsLoading(true);
        try {
            const data = await api.post("/auth/reset-password", { token: resetToken, newPassword }, { requiresAuth: false });
            setSuccessMsg("Password successfully reset! You can now log in.");
            setTimeout(() => router.push("/login"), 3000);
        } catch {
            setError("Network error");
        } finally {
            setIsLoading(false);
        }
    };

    if (resetToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <Card className="w-full max-w-md glass-panel">
                    <CardHeader className="text-center pb-6">
                        <CardTitle className="text-2xl font-sans font-bold text-primary tracking-widest uppercase">Reset Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-xs rounded uppercase tracking-wider">{error}</div>}
                        {successMsg && <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 text-green-400 text-xs rounded uppercase tracking-wider">{successMsg}</div>}
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-foreground/60 uppercase tracking-widest text-[10px]">New Password</Label>
                                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground/60 uppercase tracking-widest text-[10px]">Confirm Password</Label>
                                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                            </div>
                            <Button className="w-full bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 transition-all uppercase tracking-[0.2em] text-xs h-12" type="submit" disabled={isLoading}>{isLoading ? "Resetting..." : "Reset Password"}</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isForgotPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <Card className="w-full max-w-md glass-panel">
                    <CardHeader className="text-center pb-6">
                        <CardTitle className="text-2xl font-sans font-bold text-primary tracking-widest uppercase">Forgot Password</CardTitle>
                        <CardDescription className="text-foreground/40 font-sans text-xs tracking-wider">Enter your email to receive a reset link.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-xs rounded uppercase tracking-wider">{error}</div>}
                        {successMsg && <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 text-green-400 text-xs rounded uppercase tracking-wider">{successMsg}</div>}
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-foreground/60 uppercase tracking-widest text-[10px]">Email</Label>
                                <Input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className="bg-white/5 border-border/10 text-foreground focus:border-primary/50" />
                            </div>
                            <Button className="w-full bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 transition-all uppercase tracking-[0.2em] text-xs h-12" type="submit" disabled={isLoading}>{isLoading ? "Sending..." : "Send Reset Link"}</Button>
                            <Button type="button" variant="ghost" className="w-full mt-2 text-foreground/40 hover:text-foreground uppercase tracking-widest text-[10px]" onClick={() => setIsForgotPassword(false)}>Back to Login</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            
            <Card className="w-full max-w-md glass-panel">
                <CardHeader className="space-y-6 text-center pb-8 pt-8">
                    <div className="flex flex-col items-center">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Sample Lelo</h1>
                    </div>
                    <div>
                        <CardTitle className="text-xl font-sans font-bold text-foreground tracking-widest uppercase">Portal Access</CardTitle>
                        <CardDescription className="text-foreground/40 mt-3 font-sans text-xs tracking-wider">
                            Provide your credentials to enter
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-6 p-3 rounded bg-red-900/20 text-red-400 text-xs border border-red-500/50 font-sans tracking-wider uppercase text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="identifier" className="text-foreground/60 uppercase tracking-widest text-[10px]">Identification</Label>
                            <Input
                                id="identifier"
                                type="text"
                                placeholder="Email or Mobile"
                                value={identifier}
                                className="h-12 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans"
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-foreground/60 uppercase tracking-widest text-[10px]">Passcode</Label>
                                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] tracking-widest uppercase text-primary/70 hover:text-primary transition-colors">Recover</button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    className="h-12 pr-10 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-foreground/30 hover:text-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-4 w-4" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <Button className="w-full h-14 mt-4 text-xs font-sans uppercase tracking-[0.2em] rounded-sm bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 transition-all" type="submit" disabled={isLoading}>
                            {isLoading ? "Authenticating..." : "Authorize"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border/5 py-6 bg-foreground/20">
                    <p className="text-[10px] text-black uppercase tracking-widest font-sans">
                        New Client?{" "}
                        <Link href={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : "/register"} className="text-primary hover:text-primary/80 transition-colors ml-1 font-bold">
                            Inquire Here
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}


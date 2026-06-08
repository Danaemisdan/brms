"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ identifier, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed");
                return;
            }

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
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Request failed");
            } else {
                setSuccessMsg("If that email exists, a reset link has been sent to it.");
                setForgotEmail("");
            }
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
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: resetToken, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Reset failed");
            } else {
                setSuccessMsg("Password successfully reset! You can now log in.");
                setTimeout(() => router.push("/login"), 3000);
            }
        } catch {
            setError("Network error");
        } finally {
            setIsLoading(false);
        }
    };

    if (resetToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <Card className="w-full max-w-md shadow-lg border-0">
                    <CardHeader className="text-center pb-6">
                        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">{error}</div>}
                        {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded">{successMsg}</div>}
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            </div>
                            <Button className="w-full" type="submit" disabled={isLoading}>{isLoading ? "Resetting..." : "Reset Password"}</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isForgotPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <Card className="w-full max-w-md shadow-lg border-0">
                    <CardHeader className="text-center pb-6">
                        <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                        <CardDescription>Enter your email to receive a reset link.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">{error}</div>}
                        {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded">{successMsg}</div>}
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                            </div>
                            <Button className="w-full bg-gray-900" type="submit" disabled={isLoading}>{isLoading ? "Sending..." : "Send Reset Link"}</Button>
                            <Button type="button" variant="ghost" className="w-full mt-2" onClick={() => setIsForgotPassword(false)}>Back to Login</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <CardHeader className="space-y-4 text-center pb-6">
                    <div className="flex justify-center w-full">
                        <img src="/logo.svg" alt="BRMS Logo" className="h-16 w-auto" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight">Welcome Back</CardTitle>
                        <CardDescription className="text-gray-500 mt-2">
                            Sign in to your BRMS account
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="identifier" className="font-semibold text-gray-700">Mobile Number or Email</Label>
                            <Input
                                id="identifier"
                                type="text"
                                placeholder="Enter mobile or email"
                                value={identifier}
                                className="h-12"
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="font-semibold text-gray-700">Password</Label>
                                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm font-semibold text-blue-600 hover:underline">Forgot password?</button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    className="h-12 pr-10"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <Button className="w-full h-12 text-lg font-semibold tracking-wide rounded-xl shadow-md bg-gray-900 hover:bg-gray-800" type="submit" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t py-6 bg-gray-50/50 rounded-b-xl">
                    <p className="text-sm text-gray-500">
                        New Customer?{" "}
                        <Link href={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : "/register"} className="text-blue-600 font-semibold hover:underline">
                            Register Here
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}


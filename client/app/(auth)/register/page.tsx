"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        email: "",
        password: "",
        ecommerce_profile_url: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        if (id === "mobile") {
            setFormData({ ...formData, [id]: value.replace(/\D/g, "") });
        } else {
            setFormData({ ...formData, [id]: value });
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password.length < 6) {
            setError("Error: Password must be at least 6 characters long.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...formData,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Registration failed");
                return;
            }

            if (data.token) {
                localStorage.setItem("token", data.token);
            }

            toast.success("Registration successful! You can now track products and join campaigns.");
            router.push("/customer");
        } catch {
            setError("Cannot connect to server. Please ensure backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
            <Card className="w-full max-w-lg shadow-lg border-0">
                <CardHeader className="space-y-4 text-center pb-6">
                    <div className="flex justify-center w-full">
                        <img src="/logo.svg" alt="BRMS Logo" className="h-16 w-auto" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight">Create Customer Account</CardTitle>
                        <CardDescription className="text-gray-500 mt-2">
                            Sign up to join product review campaigns and get refunds. Brand accounts must be created by an Admin.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="font-semibold text-gray-700">Full Name</Label>
                            <Input id="name" placeholder="E.g. Rahul Sharma" value={formData.name} onChange={handleChange} required className="h-11" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="font-semibold text-gray-700">Mobile Number</Label>
                                <Input id="mobile" type="tel" placeholder="10-digit number" maxLength={10} value={formData.mobile} onChange={handleChange} required className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="font-semibold text-gray-700">Email (optional)</Label>
                                <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} className="h-11" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="font-semibold text-gray-700">Password</Label>
                            <div className="relative">
                                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a password (min 6 characters)" value={formData.password} onChange={handleChange} required className="h-11 pr-10" />
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
                            {formData.password.length > 0 && formData.password.length < 6 && (
                                <p className="text-xs text-red-500 font-medium">Password must be at least 6 characters long.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ecommerce_profile_url" className="font-semibold text-gray-700">E-commerce Profile URL (optional)</Label>
                            <Input id="ecommerce_profile_url" placeholder="https://amazon.in/gp/profile/..." value={formData.ecommerce_profile_url} onChange={handleChange} className="h-11" />
                        </div>

                        <Button className="w-full h-12 mt-6 text-lg font-semibold tracking-wide rounded-xl shadow-md bg-blue-600 hover:bg-blue-700 text-white" type="submit" disabled={isLoading || !formData.name || formData.mobile.length !== 10}>
                            {isLoading ? "Creating Account..." : "Register"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t py-6 bg-gray-50/50 rounded-b-xl">
                    <p className="text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

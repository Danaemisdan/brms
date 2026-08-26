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
import { api } from "@/lib/api";

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
            const data = await api.post("/auth/register", formData, { requiresAuth: false });

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
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
            
            <Card className="w-full max-w-lg glass-panel">
                <CardHeader className="space-y-6 text-center pb-8 pt-8">
                    <div className="flex flex-col items-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Sample Lelo</h1>
                    </div>
                    <div>
                        <CardTitle className="text-xl font-sans font-bold text-foreground tracking-widest uppercase">Client Application</CardTitle>
                        <CardDescription className="text-foreground/40 mt-3 font-sans text-xs tracking-wider">
                            Submit your credentials for access. Brand accounts require administrator approval.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-6 p-3 rounded bg-red-900/20 text-red-400 text-xs border border-red-500/50 font-sans tracking-wider uppercase text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="name" className="text-foreground/60 uppercase tracking-widest text-[10px]">Full Name</Label>
                            <Input id="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="h-12 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label htmlFor="mobile" className="text-foreground/60 uppercase tracking-widest text-[10px]">Mobile</Label>
                                <Input id="mobile" type="tel" placeholder="10 Digits" maxLength={10} value={formData.mobile} onChange={handleChange} required className="h-12 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans" />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="email" className="text-foreground/60 uppercase tracking-widest text-[10px]">Email (Optional)</Label>
                                <Input id="email" type="email" placeholder="you@domain.com" value={formData.email} onChange={handleChange} className="h-12 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="password" className="text-foreground/60 uppercase tracking-widest text-[10px]">Passcode</Label>
                            <div className="relative">
                                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={formData.password} onChange={handleChange} required className="h-12 pr-10 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans" />
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
                        <div className="space-y-3">
                            <Label htmlFor="ecommerce_profile_url" className="text-foreground/60 uppercase tracking-widest text-[10px]">E-Commerce Profile URL</Label>
                            <Input id="ecommerce_profile_url" placeholder="https://amazon..." value={formData.ecommerce_profile_url} onChange={handleChange} className="h-12 bg-white/5 border-border/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 font-sans" />
                        </div>

                        <Button className="w-full h-14 mt-6 text-xs font-sans uppercase tracking-[0.2em] rounded-sm bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 transition-all" type="submit" disabled={isLoading || !formData.name || formData.mobile.length !== 10}>
                            {isLoading ? "Processing..." : "Submit Application"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border/5 py-6 bg-foreground/20">
                    <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-sans">
                        Existing Client?{" "}
                        <Link href="/login" className="text-primary/80 hover:text-primary transition-colors ml-1">
                            Access Portal
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

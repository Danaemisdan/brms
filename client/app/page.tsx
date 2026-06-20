"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Gift, ShieldCheck, TrendingUp, Users, Target } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-x-hidden font-sans">
            
            {/* Ambient Background Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none opacity-50 z-0"></div>

            {/* Navigation / Header */}
            <header className="relative z-10 container mx-auto px-6 py-8 flex items-center justify-between">
                <div className="flex items-center">
                    <img src="/logo.svg" alt="Brand For You Logo" className="h-10 w-auto" />
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-semibold uppercase tracking-wider text-xs">
                            Login
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/50 font-bold uppercase tracking-widest text-xs h-10 px-6 rounded-sm shadow-[0_0_15px_rgba(207,46,46,0.1)] transition-all">
                            Join Now
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 container mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl"
                >
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                        Elevate Your Brand. <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Get Rewarded for Your Voice.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                        The premier ecosystem connecting ambitious brands seeking authentic growth with passionate reviewers looking for exclusive rewards.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
                        <Link href="/login">
                            <Button className="w-full sm:w-auto h-16 px-12 bg-transparent text-primary border border-primary hover:bg-primary/10 font-bold tracking-[0.2em] uppercase text-sm rounded-sm transition-all shadow-[0_0_20px_rgba(207,46,46,0.15)] flex items-center gap-3">
                                Access Portal
                            </Button>
                        </Link>
                        <Link href="/register?role=vendor">
                            <Button variant="outline" className="w-full sm:w-auto h-16 px-12 border-border hover:bg-accent text-foreground font-bold tracking-[0.2em] uppercase text-sm rounded-sm transition-all flex items-center gap-3">
                                New Client Inquiry
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
                    onClick={() => document.getElementById('reviewers')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <span className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">Discover More</span>
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="w-8 h-12 rounded-full border-2 border-muted-foreground/30 flex justify-center p-1"
                    >
                        <motion.div 
                            animate={{ y: [0, 16, 0], opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(207,46,46,0.8)]"
                        />
                    </motion.div>
                </motion.div>
            </section>

            {/* Reviewers Section */}
            <section id="reviewers" className="relative z-10 py-24 bg-card/30 border-y border-border backdrop-blur-sm">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-xs font-bold tracking-[0.3em] text-primary uppercase mb-3">For Customers</h2>
                            <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Your Opinion is Valuable. <br/>Let Us Prove It.</h3>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                Join an exclusive network of consumers who receive premium products absolutely free in exchange for honest, insightful reviews.
                            </p>
                            
                            <ul className="space-y-6 mb-10">
                                {[
                                    { icon: Gift, title: "Claim Free Products", desc: "Browse a curated catalog of premium items waiting to be tested." },
                                    { icon: Star, title: "Share Your Experience", desc: "Leave an honest review on the platform to help others." },
                                    { icon: ShieldCheck, title: "Get Reimbursed", desc: "Fast, hassle-free reimbursements directly to your account upon verification." }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <item.icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">{item.title}</h4>
                                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/register?role=customer">
                                <Button className="h-12 px-8 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary/60 font-bold tracking-widest uppercase text-xs rounded-sm transition-all group flex items-center gap-3">
                                    Start Reviewing
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            {/* Abstract Graphic Representation */}
                            <div className="aspect-square max-w-md mx-auto relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-full border border-primary/10 blur-sm"></div>
                                <div className="absolute inset-8 bg-gradient-to-tr from-primary/10 to-transparent rounded-full border border-primary/20 flex items-center justify-center animate-spin-slow"></div>
                                
                                <div className="relative z-10 w-full max-w-[280px] bg-card border border-border shadow-2xl rounded-lg p-6 rotate-3">
                                    <div className="w-12 h-12 rounded bg-primary/10 mb-4 flex items-center justify-center">
                                        <Gift className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
                                    <div className="h-4 w-1/2 bg-muted rounded mb-6"></div>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xs font-bold text-primary tracking-wider uppercase">100% Free</span>
                                        <div className="h-8 w-20 bg-primary/10 rounded flex items-center justify-center border border-primary/20">
                                            <span className="text-[10px] font-bold text-primary uppercase">Claim</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="absolute -bottom-6 -left-6 z-20 w-48 bg-card border border-border shadow-xl rounded-lg p-4 -rotate-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20"></div>
                                        <div className="flex space-x-1">
                                            {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-primary fill-primary" />)}
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded mb-1.5"></div>
                                    <div className="h-2 w-4/5 bg-muted rounded"></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Brands Section */}
            <section id="brands" className="relative z-10 py-24">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="order-2 lg:order-1 relative"
                        >
                            {/* Abstract Graphic Representation */}
                            <div className="aspect-square max-w-md mx-auto relative flex items-center justify-center">
                                <div className="absolute inset-4 bg-gradient-to-bl from-primary/5 to-transparent rounded-lg border border-primary/10 rotate-6"></div>
                                
                                <div className="relative z-10 w-full bg-card border border-border shadow-2xl rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                                        <div>
                                            <h4 className="text-sm font-bold text-foreground">Campaign Performance</h4>
                                            <span className="text-xs text-muted-foreground">Last 30 days</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <TrendingUp className="w-5 h-5 text-primary" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-2">
                                                <span className="text-muted-foreground">Authentic Reviews</span>
                                                <span className="text-primary">+245</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded overflow-hidden">
                                                <div className="h-full bg-primary w-[75%] rounded"></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-2">
                                                <span className="text-muted-foreground">Market Ranking</span>
                                                <span className="text-primary">Top 10</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded overflow-hidden">
                                                <div className="h-full bg-primary w-[90%] rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="order-1 lg:order-2"
                        >
                            <h2 className="text-xs font-bold tracking-[0.3em] text-primary uppercase mb-3">For Brands & Vendors</h2>
                            <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Dominate the Market with <br/>Authentic Social Proof.</h3>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                Accelerate your product's growth by putting it directly into the hands of real people who are eager to experience and review your brand.
                            </p>
                            
                            <ul className="space-y-6 mb-10">
                                {[
                                    { icon: TrendingUp, title: "Accelerate Growth", desc: "Launch products with guaranteed initial traction and visibility." },
                                    { icon: Users, title: "Genuine Reach", desc: "Connect with real users who provide authentic, verified feedback." },
                                    { icon: Target, title: "Full Campaign Control", desc: "Manage promotions, track performance, and verify proofs via an advanced dashboard." }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <item.icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">{item.title}</h4>
                                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/register?role=vendor">
                                <Button className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90 font-bold tracking-widest uppercase text-xs rounded-sm transition-all group flex items-center gap-3">
                                    Partner With Us
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 border-t border-border bg-card/50">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <img src="/logo.svg" alt="Brand For You Logo" className="h-8 w-auto mb-2" />
                        <p className="text-xs text-muted-foreground tracking-widest uppercase">© 2024 BRMS. All rights reserved.</p>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/login" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase">Login</Link>
                        <Link href="/register" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase">Join Platform</Link>
                    </div>
                </div>
            </footer>

        </div>
    );
}

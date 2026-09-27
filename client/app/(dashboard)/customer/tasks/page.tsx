"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Share2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function CustomerTasksPage() {
    const searchParams = useSearchParams();
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [submitTaskModal, setSubmitTaskModal] = useState<any>(null);
    const [proofLink, setProofLink] = useState("");
    const [remarks, setRemarks] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        const highlightTaskId = searchParams.get("highlight_task");
        if (highlightTaskId && tasks.length > 0) {
            setTimeout(() => {
                const el = document.getElementById(`task-${highlightTaskId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add("ring-4", "ring-primary", "ring-offset-2", "scale-[1.02]", "transition-all", "duration-500");
                    setTimeout(() => {
                        el.classList.remove("ring-4", "ring-primary", "ring-offset-2", "scale-[1.02]");
                    }, 3000);
                }
            }, 500);
        }
    }, [searchParams, tasks]);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/tasks?is_public=true");
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            toast.error("Failed to load tasks");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitProof = async () => {
        if (!proofLink && !remarks) {
            return toast.error("Please provide a proof link or remarks.");
        }
        setIsSubmitting(true);
        try {
            const res = await apiFetch(`/api/tasks/${submitTaskModal.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proof_link: proofLink, remarks })
            });
            if (res.ok) {
                toast.success("Task proof submitted successfully! Our team will review it.");
                setSubmitTaskModal(null);
                setProofLink("");
                setRemarks("");
            } else {
                toast.error("Failed to submit task.");
            }
        } catch {
            toast.error("An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Tasks & Offers</h1>
                <p className="text-muted-foreground text-lg">Complete these simple tasks and earn additional rewards instantly!</p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="overflow-hidden flex flex-col h-[400px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-md">
                            <Skeleton className="h-48 w-full rounded-none" />
                            <CardHeader className="pb-2">
                                <Skeleton className="h-6 w-3/4 rounded-full" />
                            </CardHeader>
                            <CardContent className="flex-1 pb-4">
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-5/6" />
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 p-4 border-t border-slate-100 gap-3 flex">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <Skeleton className="h-12 flex-1 rounded-xl" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-16 bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl flex flex-col items-center justify-center min-h-[300px]"
                >
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                        <Share2 className="w-10 h-10 text-blue-400" />
                    </div>
                    <p className="text-2xl font-semibold text-slate-800">No tasks available right now</p>
                    <p className="text-muted-foreground mt-2">Check back later for new rewarding tasks.</p>
                </motion.div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {tasks.map(task => (
                        <motion.div variants={itemVariants} key={task.id}>
                            <Card 
                                id={`task-${task.id}`} 
                                className="overflow-hidden flex flex-col relative rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 bg-white/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] group h-full"
                            >
                                <div className="h-48 w-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden relative border-b border-slate-100/50">
                                    <div className="absolute inset-0 bg-black/5 z-10 group-hover:bg-transparent transition-colors duration-500" />
                                    {task.image_url ? (
                                        <img src={task.image_url} alt={task.title} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-slate-300 h-full">
                                            <Share2 className="w-12 h-12 mb-2 opacity-50" />
                                            <span className="font-medium text-sm">No Image</span>
                                        </div>
                                    )}
                                    
                                    {task.reward_amount > 0 && (
                                        <div className="absolute bottom-4 left-4 z-20 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-extrabold text-sm px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 transform group-hover:scale-105 transition-transform origin-left">
                                            Earn ₹{task.reward_amount}
                                        </div>
                                    )}
                                </div>
                                
                                <CardContent className="flex-1 p-6 flex flex-col bg-white/90">
                                    <h3 className="font-bold text-xl leading-tight line-clamp-2 text-slate-900 group-hover:text-blue-600 transition-colors mb-3">
                                        {task.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm whitespace-pre-line leading-relaxed">
                                        {task.description}
                                    </p>
                                </CardContent>
                                
                                <CardFooter className="pt-0 bg-slate-50/50 p-4 border-t border-slate-100/50 gap-3 flex">
                                    <Button 
                                        variant="outline" 
                                        className="h-12 w-12 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all shrink-0" 
                                        onClick={() => {
                                            const url = `${window.location.origin}/customer/tasks?highlight_task=${task.id}`;
                                            navigator.clipboard.writeText(url);
                                            toast.success("Link copied to clipboard!");
                                        }} 
                                        title="Share Task"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </Button>
                                    
                                    {task.action_url ? (
                                        <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-bold text-sm shadow-md hover:shadow-xl hover:shadow-blue-500/20 transition-all hover:-translate-y-0.5" onClick={() => window.open(task.action_url, '_blank')}>
                                            {task.action_text || "Complete Task"}
                                        </Button>
                                    ) : (
                                        <Button 
                                            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-bold text-sm shadow-md hover:shadow-xl hover:shadow-blue-500/20 transition-all hover:-translate-y-0.5" 
                                            onClick={() => setSubmitTaskModal(task)}
                                        >
                                            {task.action_text || "Submit Proof"}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {submitTaskModal && (
                <Dialog open={!!submitTaskModal} onOpenChange={(open) => !open && setSubmitTaskModal(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Submit Task Proof</DialogTitle>
                            <DialogDescription>
                                Provide proof of completion for: <strong>{submitTaskModal.title}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Proof Link (e.g. Google Drive, Post URL)</Label>
                                <Input 
                                    placeholder="https://..." 
                                    value={proofLink}
                                    onChange={(e) => setProofLink(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Additional Remarks</Label>
                                <Textarea 
                                    placeholder="Any details to help us verify your submission..." 
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSubmitTaskModal(null)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmitProof} disabled={isSubmitting}>
                                {isSubmitting ? "Submitting..." : "Submit Proof"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

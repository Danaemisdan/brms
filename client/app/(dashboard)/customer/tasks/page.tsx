"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

export default function CustomerTasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

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

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Tasks & Offers</h1>
                <p className="text-muted-foreground text-lg">Complete these simple tasks and earn additional rewards instantly!</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : tasks.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-lg border border-dashed">
                    <p className="text-gray-500 text-lg">No tasks are currently available. Check back later!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => (
                        <Card key={task.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow border-gray-200">
                            {task.image_url ? (
                                <div className="h-48 w-full bg-gray-100 overflow-hidden relative border-b">
                                    <img src={task.image_url} alt={task.title} className="object-cover w-full h-full" />
                                    {task.reward_amount > 0 && (
                                        <div className="absolute bottom-2 left-2 bg-green-500 text-white font-bold text-sm px-3 py-1 rounded-full shadow-md">
                                            Earn ₹{task.reward_amount}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-48 w-full bg-primary/5 flex items-center justify-center relative border-b">
                                    <span className="text-primary/40 font-medium">No Image</span>
                                    {task.reward_amount > 0 && (
                                        <div className="absolute bottom-2 left-2 bg-green-500 text-white font-bold text-sm px-3 py-1 rounded-full shadow-md">
                                            Earn ₹{task.reward_amount}
                                        </div>
                                    )}
                                </div>
                            )}
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl line-clamp-1">{task.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 pb-4">
                                <p className="text-gray-600 text-sm whitespace-pre-line">{task.description}</p>
                            </CardContent>
                            <CardFooter className="pt-0 bg-gray-50 p-4 border-t">
                                <Button className="w-full font-semibold" onClick={() => {
                                    toast.success("To complete this task, follow the instructions and submit your proof in a Ticket!");
                                }}>
                                    Complete Task
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

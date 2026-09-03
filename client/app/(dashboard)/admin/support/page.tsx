"use client";

import { apiFetch } from "@/lib/apiFetch";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = "";

type Message = { id: string; from: "customer" | "admin"; text: string; time: string };

type Thread = {
    id: string;
    customer: string;
    lastMessage: string;
    unread: boolean;
    messages: Message[];
};

export default function AdminSupport() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [reply, setReply] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? null;

    useEffect(() => {
        fetchThreads();
    }, []);

    const fetchThreads = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/support`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setThreads(json.data);
                if (json.data.length > 0 && !selectedThreadId) {
                    setSelectedThreadId(json.data[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch support threads", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim() || !selectedThread) return;

        const messageText = reply;
        setReply(""); // Optimistic clear

        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch(`${API_URL}/api/support/${selectedThread.id}/reply`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ text: messageText })
            });

            if (res.ok) {
                const json = await res.json();
                const newMessage = json.data;

                setThreads((prevThreads) =>
                    prevThreads.map((thread) => {
                        if (thread.id !== selectedThread.id) return thread;
                        return {
                            ...thread,
                            unread: false,
                            lastMessage: messageText,
                            messages: [...thread.messages, newMessage],
                        };
                    })
                );
            }
        } catch (error) {
            console.error("Failed to send reply", error);
            setReply(messageText); // Restore on error
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Support Inbox</h1>
                <p className="text-gray-500">Respond to customer messages and grievances.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3" style={{ height: "65vh" }}>
                {/* Thread List */}
                <div className="space-y-2 overflow-y-auto border rounded-lg p-4 bg-white">
                    {isLoading ? (
                        <p className="text-sm text-gray-500 text-center py-4">Loading messages...</p>
                    ) : threads.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Inbox is empty.</p>
                    ) : (
                        threads.map((thread) => (
                            <div
                                key={thread.id}
                                onClick={() => setSelectedThreadId(thread.id)}
                                className={`p-3 rounded-lg cursor-pointer ${selectedThreadId === thread.id ? "bg-blue-50/50 ring-1 ring-blue-100" : "hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm text-gray-900">{thread.customer}</span>
                                    {thread.unread && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-1">{thread.lastMessage}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Chat Area */}
                <Card className="md:col-span-2 flex flex-col bg-white border-gray-200">
                    {selectedThread ? (
                        <>
                            <CardHeader className="border-b border-gray-100 bg-gray-50/30">
                                <CardTitle className="text-lg text-gray-900">{selectedThread.customer}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                                {selectedThread.messages.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
                                ) : (
                                    selectedThread.messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.from === "admin"
                                                ? "bg-blue-600 text-foreground rounded-br-sm"
                                                : "bg-gray-100 text-gray-900 rounded-bl-sm border border-gray-200/50"
                                                }`}>
                                                <p className="leading-relaxed">{msg.text}</p>
                                                <p className={`text-[10px] mt-1.5 font-medium ${msg.from === "admin" ? "text-blue-200" : "text-gray-400"}`}>{msg.time}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                            <div className="border-t border-gray-100 p-4 bg-gray-50/30">
                                <form onSubmit={handleSend} className="flex gap-2">
                                    <Input
                                        placeholder="Type your reply..."
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        className="flex-1 bg-white border-gray-200 focus-visible:ring-blue-500"
                                    />
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-foreground shadow-sm">Send</Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium">Select a conversation to reply</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

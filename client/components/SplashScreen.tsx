"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Show splash screen for 1.8 seconds
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <AnimatePresence mode="wait">
                {isLoading && (
                    <motion.div
                        key="splash"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-zinc-950"
                    >
                        {/* Minimal Vibe Logo Reveal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="flex flex-col items-center"
                        >
                            <img src="/logo.svg" alt="BRMS Logo" className="h-24 md:h-36 w-auto -mb-4" />
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
                                className="h-[2px] bg-primary/50 mt-4 mb-3"
                            />
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                className="font-sans text-xs font-semibold tracking-[0.3em] text-primary/80 uppercase"
                            >
                                Brand For You
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main App Content - fades in after splash */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoading ? 0 : 1 }}
                transition={{ duration: 0.8, delay: isLoading ? 0 : 0.2 }}
                className="min-h-screen"
            >
                {children}
            </motion.div>
        </>
    );
}

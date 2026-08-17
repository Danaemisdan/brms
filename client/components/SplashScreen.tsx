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
                            <img src="/sample-lelo-logo.png" alt="Sample Lelo Logo" className="h-32 md:h-48 w-auto -mb-4 object-contain" />
                            <img src="/sample-lelo-logo.png" alt="Sample Lelo Logo" className="h-32 md:h-48 w-auto -mb-4 object-contain" />
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

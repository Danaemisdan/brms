"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-8 overflow-hidden selection:bg-primary/20">
      
      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.main 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 1.5 }} // delay after splash screen
        className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center space-y-12 p-8 md:p-16"
      >
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="flex flex-col items-center justify-center w-full mb-4"
        >
          <h2 className="font-sans text-5xl md:text-7xl font-bold tracking-[0.2em] text-primary uppercase">
            BRMS
          </h2>
          <div className="h-[2px] w-24 bg-primary/50 mt-3 mb-2" />
          <p className="font-sans text-xs font-semibold tracking-[0.4em] text-primary/80 uppercase">Brand For You</p>
        </motion.div>

        <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-sans font-bold text-foreground leading-tight tracking-wide">
            The Premier Destination For <br className="hidden md:block" /> 
            <span className="text-primary italic font-medium">Brand Reputation</span> Management.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-sans font-light">
            A centralized platform to manage product campaigns, track customer submissions, and orchestrate verified refunds.
            </p>
        </div>

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.2 }}
            className="flex flex-col sm:flex-row gap-6 pt-10 w-full justify-center max-w-md"
        >
          <Link href="/login" className="flex-1 w-full sm:w-auto group">
            <button className="relative w-full h-14 bg-transparent border border-primary/50 text-primary font-sans font-semibold tracking-[0.1em] uppercase text-xs overflow-hidden transition-all hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_20px_rgba(220,38,38,0.2)]">
              <span className="relative z-10">Access Portal</span>
            </button>
          </Link>
          <Link href="/register" className="flex-1 w-full sm:w-auto group">
            <button className="w-full h-14 bg-card border border-border text-foreground font-sans font-semibold tracking-[0.1em] text-xs uppercase transition-all hover:bg-accent hover:text-accent-foreground shadow-sm">
              New Client Inquiry
            </button>
          </Link>
        </motion.div>

        <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.5 }}
            className="text-[10px] text-muted-foreground mt-16 pt-8 border-t border-border w-full max-w-sm uppercase tracking-widest font-sans font-semibold"
        >
          Strictly Invite-Only For Brand Partners.
        </motion.p>
      </motion.main>
    </div>
  );
}

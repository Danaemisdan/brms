"use client";

import { motion } from "framer-motion";
import { Headphones, Smartphone, Gift, Star, ShieldCheck } from "lucide-react";

export function HeroAnimation() {
  return (
    <div className="relative w-full max-w-[500px] h-[400px] flex items-center justify-center perspective-[1000px]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/30 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Main Floating Card */}
      <motion.div 
        animate={{ 
          y: [-10, 10, -10], 
          rotateX: [5, 10, 5], 
          rotateY: [-5, 5, -5] 
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-64 h-[320px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col"
      >
        <div className="h-[55%] bg-gradient-to-br from-[#f8f6f0] to-[#e8e4db] w-full flex items-center justify-center p-6 relative">
            <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                100% CASHBACK
            </div>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Headphones className="w-24 h-24 text-gray-800 drop-shadow-xl" />
            </motion.div>
        </div>
        <div className="p-5 flex flex-col flex-1 bg-white">
            <div className="flex justify-between items-start mb-3">
                <div className="h-4 w-3/4 bg-gray-200 rounded-full"></div>
                <Star className="w-4 h-4 text-[#ffc107] fill-[#ffc107]" />
            </div>
            <div className="h-3 w-1/2 bg-gray-100 rounded-full mb-6"></div>
            <div className="mt-auto flex justify-between items-center">
                <div className="h-6 w-1/3 bg-gray-200 rounded-full"></div>
                <div className="h-8 w-2/5 bg-primary rounded-xl shadow-md flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">Claim Now</span>
                </div>
            </div>
        </div>
      </motion.div>

      {/* Floating Element 1 - Phone */}
      <motion.div 
        animate={{ y: [0, -20, 0], x: [0, 15, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-12 left-4 md:left-8 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-xl z-20"
      >
        <Smartphone className="w-8 h-8 text-white/90" />
      </motion.div>

      {/* Floating Element 2 - Gift */}
      <motion.div 
        animate={{ y: [0, 25, 0], x: [0, -15, 0], rotate: [0, -15, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute bottom-16 -right-2 md:right-4 w-20 h-20 bg-primary/20 backdrop-blur-xl rounded-full border border-primary/30 flex items-center justify-center shadow-xl z-20"
      >
        <Gift className="w-10 h-10 text-primary" />
      </motion.div>
      
      {/* Floating Element 3 - Trust Badge */}
      <motion.div 
        animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/2 -left-6 md:-left-10 w-14 h-14 bg-green-500/20 backdrop-blur-xl rounded-full border border-green-500/30 flex items-center justify-center shadow-xl z-0"
      >
        <ShieldCheck className="w-7 h-7 text-green-400" />
      </motion.div>
    </div>
  );
}

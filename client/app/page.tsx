"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SampleCollections } from "@/components/SampleCollections";
import { CommunityVoices } from "@/components/CommunityVoices";
import { ShopByBrand } from "@/components/ShopByBrand";
import { TrendingDeals } from "@/components/TrendingDeals";
import { HotSamples } from "@/components/HotSamples";
import { TrustedPartners } from "@/components/TrustedPartners";
import { FaqSection } from "@/components/FaqSection";
import { Search, ShoppingBag, ShoppingCart, PenTool, DollarSign } from "lucide-react";
import { ShinyText } from "@/components/ui/ShinyText";
import { MagicCard } from "@/components/ui/MagicCard";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#fcfcfc] text-gray-900 pt-16 pb-20 relative overflow-hidden">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-start"
          >
            <h1 className="text-5xl md:text-[6rem] font-black leading-[1.05] mb-8 tracking-tighter text-[#1a1a24]">
              Discover <ShinyText text="New Brands." /><br />
              Sample for Free.
            </h1>
            <p className="text-base md:text-lg text-gray-500 mb-12 max-w-md leading-relaxed tracking-tight">
              Register to explore a world of free product samples from premium brands you'll love.
            </p>
            
            <div className="flex w-full max-w-md items-center bg-white border border-gray-200 rounded-full p-1.5 mb-8 shadow-sm">
              <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search Sample Brands" 
                className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-gray-900 placeholder:text-gray-400"
              />
              <Button className="bg-[#eb5757] hover:bg-[#d64c4c] text-white rounded-full px-8 py-5 text-sm font-semibold flex-shrink-0">
                Sign up
              </Button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex justify-center items-center relative h-[350px] md:h-[450px]"
          >
            <div className="relative w-full max-w-md h-full flex items-center justify-center">
              
              {/* Subtle background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gray-50 rounded-full blur-[60px]"></div>

              {/* Back Left Card */}
              <motion.div 
                animate={{ y: [0, -4, 0], rotate: [-12, -12, -12] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute z-10 w-40 bg-white border border-gray-100 shadow-[0_10px_40px_rgb(0,0,0,0.03)] rounded-3xl p-3 pb-6 flex flex-col items-center -left-6 md:-left-12 top-12"
              >
                <div className="w-full aspect-square bg-[#f8f9fa] rounded-2xl mb-4 flex flex-col items-center justify-center text-gray-400">
                   <div className="w-6 h-6 border-2 border-gray-200 rounded mb-1 flex items-center justify-center overflow-hidden">
                     <div className="w-full h-full bg-blue-100 rotate-45 translate-y-2"></div>
                   </div>
                   <span className="text-sm font-semibold text-gray-500">Snack</span>
                </div>
                <div className="w-3/4 h-1.5 bg-gray-100 rounded-full mb-2.5"></div>
                <div className="w-1/2 h-1.5 bg-gray-100 rounded-full"></div>
              </motion.div>

              {/* Back Right Card */}
              <motion.div 
                animate={{ y: [0, -6, 0], rotate: [12, 12, 12] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
                className="absolute z-10 w-40 bg-white border border-gray-100 shadow-[0_10px_40px_rgb(0,0,0,0.03)] rounded-3xl p-3 pb-6 flex flex-col items-center -right-6 md:-right-12 top-20"
              >
                <div className="w-full aspect-square bg-white rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                  <div className="w-20 h-16 bg-[#ffd166] rounded-md flex items-center justify-center text-2xl">
                    🎧
                  </div>
                </div>
                <div className="w-3/4 h-1.5 bg-gray-100 rounded-full mb-2.5"></div>
                <div className="w-1/2 h-1.5 bg-gray-100 rounded-full"></div>
              </motion.div>

              {/* Center Main Card */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                className="absolute z-20 w-48 bg-white border border-gray-100 shadow-[0_20px_50px_rgb(0,0,0,0.08)] rounded-[32px] p-4 pb-8 flex flex-col items-center top-8"
              >
                <div className="w-full aspect-square bg-[#f7f5ee] rounded-2xl mb-6 overflow-hidden p-3 flex items-center justify-center">
                  <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop" alt="Serum" className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm" />
                </div>
                <div className="w-4/5 h-2 bg-gray-100 rounded-full mb-3"></div>
                <div className="w-3/5 h-2 bg-gray-100 rounded-full"></div>
                
                {/* Red Pill overlapping bottom */}
                <div className="absolute -bottom-4 bg-[#eb5757] text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg">
                  100% Refund
                </div>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* New Mockup Sections */}
      <SampleCollections />
      <CommunityVoices />

      {/* Existing Sections (Restyled for flat design) */}
      <ShopByBrand />
      <TrendingDeals />
      <HotSamples />

      {/* How it Works Section */}
      <section className="py-20 bg-white border-t border-gray-100" id="how-it-works">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">How It Works</h2>
          <p className="text-gray-500 mb-16 max-w-sm mx-auto text-sm">
            How we kept transaction and mystery one process.
          </p>
          
          <div className="flex flex-col md:flex-row justify-center items-start gap-8 md:gap-4 relative max-w-4xl mx-auto">
            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 relative">
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-white">✓</div>
                <ShoppingBag className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-sm mb-1 text-gray-900">Join Sample Lelo</h3>
              <p className="text-xs text-gray-500">Create a Profile</p>
            </div>
            
            <div className="hidden md:block text-gray-300 font-light text-xl mt-6">➔</div>
            
            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 relative">
                <Search className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-sm mb-1 text-gray-900">Discover Samples</h3>
              <p className="text-xs text-gray-500">Find available packs</p>
            </div>

            <div className="hidden md:block text-gray-300 font-light text-xl mt-6">➔</div>
            
            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 relative">
                <div className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 border-white">@</div>
                <PenTool className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-sm mb-1 text-gray-900">Request</h3>
              <p className="text-xs text-gray-500">Apply for a sample box</p>
            </div>

            <div className="hidden md:block text-gray-300 font-light text-xl mt-6">➔</div>
            
            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 relative">
                <div className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 border-white font-bold">4</div>
                <DollarSign className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-sm mb-1 text-gray-900">Share Feedback</h3>
              <p className="text-xs text-gray-500">Complete a quick survey</p>
            </div>
          </div>
        </div>
      </section>

      {/* More New Sections */}
      <TrustedPartners />
      <FaqSection />

    </div>
  );
}

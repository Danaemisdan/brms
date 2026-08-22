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
import { Search, ShoppingBag, ShoppingCart, PenTool, DollarSign, Star } from "lucide-react";
import { ShinyText } from "@/components/ui/ShinyText";
import { MagicCard } from "@/components/ui/MagicCard";
import { VelocityScroll } from "@/components/ui/VelocityScroll";

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
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex justify-center items-center relative h-[400px] md:h-[500px] perspective-[1000px]"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-red-200 to-orange-100 rounded-full blur-[80px] opacity-70"></div>

            {/* Main Center UI Mockup */}
            <motion.div 
              animate={{ y: [0, -15, 0], rotateY: [-5, 5, -5], rotateX: [2, -2, 2] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative w-full max-w-[320px] bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_30px_60px_rgba(0,0,0,0.08)] rounded-[32px] p-2 overflow-hidden z-20"
            >
              {/* Inner content simulating an app feed */}
              <div className="bg-[#f8f9fa] w-full h-[380px] rounded-[24px] overflow-hidden relative flex flex-col">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none"></div>
                
                {/* Hero Image */}
                <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop" alt="Premium Cosmetic" className="w-full h-56 object-cover" />
                
                {/* Floating Tag */}
                <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-[#eb5757] tracking-widest shadow-sm">
                  NEW DROP
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white p-5 flex flex-col justify-between relative -mt-4 rounded-t-[20px] shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-20">
                  <div>
                    <h3 className="font-bold text-lg leading-tight mb-1">Anti-Aging Serum Mini</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">Experience the revitalizing power of organic ingredients.</p>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex gap-1 items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                       <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                       <span className="text-xs font-bold">4.9</span>
                    </div>
                    <button className="bg-[#1a1a24] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">
                      Claim Sample
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Back Floating Element Left */}
            <motion.div 
              animate={{ y: [0, -10, 0], rotate: [-6, -6, -6] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute z-10 w-48 h-32 bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.05)] rounded-[24px] p-4 flex flex-col justify-between -left-4 md:-left-12 top-24"
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">🎉</div>
                 <div>
                   <div className="w-16 h-2 bg-gray-200 rounded-full mb-1.5"></div>
                   <div className="w-10 h-1.5 bg-gray-100 rounded-full"></div>
                 </div>
              </div>
              <div className="w-full h-8 bg-gray-50 rounded-lg border border-gray-100 flex items-center px-3">
                 <div className="w-3/4 h-1.5 bg-gray-200 rounded-full"></div>
              </div>
            </motion.div>

            {/* Back Floating Element Right */}
            <motion.div 
              animate={{ y: [0, -8, 0], rotate: [8, 8, 8] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }}
              className="absolute z-10 w-44 bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.05)] rounded-[24px] p-3 -right-4 md:-right-8 top-16"
            >
               <div className="w-full h-32 bg-[#fdfaf5] rounded-[16px] mb-3 overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover mix-blend-multiply opacity-80" />
               </div>
               <div className="w-24 h-2 bg-gray-200 rounded-full mb-2 mx-auto"></div>
               <div className="w-16 h-1.5 bg-gray-100 rounded-full mx-auto"></div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Velocity Scroll Section */}
      <section className="py-12 bg-[#1a1a24] text-white overflow-hidden border-b border-gray-800">
        <VelocityScroll 
          text="FREE SAMPLES • TOP BRANDS • DAILY DROPS •" 
          defaultVelocity={3} 
          className="text-[4rem] md:text-[6rem] font-black opacity-90"
        />
        <VelocityScroll 
          text="DISCOVER REWARDS • SHOP PREMIUM •" 
          defaultVelocity={-3} 
          className="text-[4rem] md:text-[6rem] font-black opacity-40 mt-2"
        />
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

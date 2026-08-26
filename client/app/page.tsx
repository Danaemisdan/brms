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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <motion.div 
              animate={{ y: [-15, 15, -15], rotateZ: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="relative z-30"
            >
              <div className="w-[280px] h-[380px] bg-white/60 backdrop-blur-3xl rounded-[32px] p-3 border border-white/60 shadow-[0_30px_60px_rgba(0,0,0,0.08)] flex flex-col group">
                <div className="flex-1 w-full rounded-[24px] overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt="Premium Cosmetic" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5">
                     <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Premium Collection</p>
                     <p className="text-white text-xl font-black tracking-tight leading-tight">L'Eau de Parfum</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [15, -15, 15], x: [-5, 5, -5], rotateZ: [6, 3, 6] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
              className="absolute z-20 -right-4 md:right-4 top-10"
            >
              <div className="w-[200px] h-[280px] bg-white/40 backdrop-blur-2xl rounded-[28px] p-2.5 border border-white/50 shadow-xl opacity-95 flex flex-col group">
                <div className="flex-1 w-full rounded-[20px] overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt="Skincare" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [10, -10, 10], x: [5, -5, 5], rotateZ: [-12, -8, -12] }}
              transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
              className="absolute z-10 -left-4 md:left-4 bottom-10"
            >
              <div className="w-[180px] h-[240px] bg-white/30 backdrop-blur-xl rounded-[24px] p-2 border border-white/40 shadow-lg opacity-80 flex flex-col group">
                <div className="flex-1 w-full rounded-[18px] overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt="Organic Bar" />
                </div>
              </div>
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

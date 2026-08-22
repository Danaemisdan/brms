"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HeroAnimation } from "@/components/HeroAnimation";
import { ShopByBrand } from "@/components/ShopByBrand";
import { TrendingDeals } from "@/components/TrendingDeals";
import { HotSamples } from "@/components/HotSamples";
import { TrustedPartners } from "@/components/TrustedPartners";
import { FaqSection } from "@/components/FaqSection";
import { Search, ShoppingBag, ShoppingCart, PenTool, DollarSign } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#1a1a24] text-white py-16 md:py-24 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-start"
          >
            <h1 className="text-4xl md:text-6xl font-bold font-heading leading-tight mb-6">
              Discover New Brands. <br className="hidden md:block" />
              <span className="text-primary">Sample for Free.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-lg leading-relaxed">
              Register to explore a world of free product samples from brands you'll love. Provide honest feedback and get up to 100% refund.
            </p>
            
            <div className="flex w-full max-w-md items-center bg-white rounded-full p-2 mb-8 shadow-lg">
              <Search className="w-6 h-6 text-gray-400 ml-3" />
              <input 
                type="text" 
                placeholder="Search Sample Brands" 
                className="flex-1 bg-transparent border-none outline-none px-4 text-black placeholder:text-gray-400"
              />
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 font-bold text-lg">
                Sign Up
              </Button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center"
          >
            <HeroAnimation />
          </motion.div>
        </div>
      </section>

      {/* New Sections */}
      <ShopByBrand />
      <TrendingDeals />
      <HotSamples />

      {/* How it Works Section */}
      <section className="py-20 bg-white border-t border-gray-100" id="how-it-works">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold font-heading mb-4">How It Works</h2>
          <p className="text-muted-foreground mb-16 max-w-2xl mx-auto">
            Get free samples in four easy steps.
          </p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-4 relative">
            <div className="flex flex-col items-center max-w-[200px]">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-red-100">
                <ShoppingBag className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold mb-2">Join Sample Lelo</h3>
              <p className="text-xs text-muted-foreground">Create a Profile</p>
            </div>
            <div className="hidden md:block text-gray-300 font-light text-xl">➔</div>
            
            <div className="flex flex-col items-center max-w-[200px]">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-red-100">
                <ShoppingCart className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold mb-2">Discover Samples</h3>
              <p className="text-xs text-muted-foreground">Find available packs</p>
            </div>
            <div className="hidden md:block text-gray-300 font-light text-xl">➔</div>
            
            <div className="flex flex-col items-center max-w-[200px]">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-red-100">
                <PenTool className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold mb-2">Request</h3>
              <p className="text-xs text-muted-foreground">Apply for a sample box</p>
            </div>
            <div className="hidden md:block text-gray-300 font-light text-xl">➔</div>
            
            <div className="flex flex-col items-center max-w-[200px]">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-red-100">
                <DollarSign className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold mb-2">Share Feedback</h3>
              <p className="text-xs text-muted-foreground">Complete a quick survey to get refund</p>
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

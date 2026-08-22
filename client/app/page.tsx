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

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#fcfcfc] text-gray-900 pt-16 pb-20 relative overflow-hidden">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-start"
          >
            <h1 className="text-4xl md:text-[3.5rem] font-bold leading-[1.1] mb-6 tracking-tight">
              Discover New Brands.<br />
              Sample for Free.
            </h1>
            <p className="text-sm md:text-base text-gray-600 mb-8 max-w-sm leading-relaxed">
              Register to explore a world of free product samples from brands you'll love.
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center relative h-[300px] md:h-[400px]"
          >
            {/* Box Illustration Mockup */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-72 h-64">
                {/* Box */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-32 bg-[#e0d6c8] border-2 border-black rounded-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                   <div className="absolute top-0 left-0 w-full h-4 border-b-2 border-black bg-[#d1c6b6]"></div>
                   <div className="absolute -top-12 left-4 w-12 h-16 bg-[#fff] border-2 border-black shadow-sm"></div>
                   <div className="absolute -top-8 right-8 w-10 h-20 bg-[#fff] border-2 border-black rounded-full shadow-sm"></div>
                </div>
                {/* Hand 1 */}
                <div className="absolute top-4 right-0 w-32 h-16 bg-[#eb5757] rounded-l-full border-2 border-black origin-right -rotate-12 flex justify-start items-center overflow-hidden">
                    <div className="w-12 h-full bg-white border-r-2 border-black"></div>
                </div>
                {/* Hand 2 */}
                <div className="absolute bottom-0 left-0 w-24 h-48 bg-white border-2 border-black rounded-t-full -rotate-[30deg] origin-bottom shadow-sm">
                </div>
                
                {/* Sparkles */}
                <div className="absolute top-10 left-10 text-red-400 text-xl">✦</div>
                <div className="absolute bottom-20 right-10 text-red-400 text-xl">✦</div>
              </div>
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

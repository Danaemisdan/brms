"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const BRANDS = [
  { 
    name: "Amazon", 
    tagline: "100% Free Samples", 
    badge: "150+ Live Drops",
    color: "text-amber-600 bg-amber-50 border-amber-200" 
  },
  { 
    name: "Flipkart", 
    tagline: "100% UPI Refund", 
    badge: "80+ Live Drops",
    color: "text-blue-600 bg-blue-50 border-blue-200" 
  },
  { 
    name: "Nykaa", 
    tagline: "Beauty & Skincare", 
    badge: "60+ Live Drops",
    color: "text-pink-600 bg-pink-50 border-pink-200" 
  },
  { 
    name: "Myntra", 
    tagline: "Fashion & Lifestyle", 
    badge: "45+ Live Drops",
    color: "text-purple-600 bg-purple-50 border-purple-200" 
  },
  { 
    name: "AJIO", 
    tagline: "Trendsetters", 
    badge: "30+ Live Drops",
    color: "text-slate-700 bg-slate-50 border-slate-200" 
  },
  { 
    name: "Tata CLiQ", 
    tagline: "Luxury Tech & Home", 
    badge: "25+ Live Drops",
    color: "text-red-600 bg-red-50 border-red-200" 
  },
];

export function ShopByBrand() {
  return (
    <section className="py-20 md:py-24 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
          <div>
            <div className="text-xs font-bold text-red-600 uppercase tracking-widest bg-red-50 border border-red-100 px-3 py-1 rounded-full inline-block mb-3">
              Official Marketplace Hub
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 leading-none">
              Shop by Marketplace
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mt-2">
              Claim 100% free product samples across India&apos;s leading e-commerce platforms.
            </p>
          </div>
          <Link 
            href="/browse" 
            className="text-xs sm:text-sm font-bold text-gray-900 hover:text-red-600 transition-colors bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2.5 rounded-full shadow-sm flex items-center gap-1.5"
          >
            All Platforms <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {BRANDS.map((brand, idx) => (
            <Link key={idx} href={`/browse?platform=${encodeURIComponent(brand.name)}`}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-between p-5 bg-white rounded-2xl border border-gray-200/80 hover:border-red-200 hover:shadow-lg transition-all h-full text-center group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-50 group-hover:bg-red-50/50 flex items-center justify-center font-black text-xl text-gray-800 group-hover:text-red-600 transition-colors mb-3 border border-gray-100">
                  {brand.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="w-full">
                  <h3 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 mb-2 font-medium">
                    {brand.tagline}
                  </p>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${brand.color}`}>
                  {brand.badge}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
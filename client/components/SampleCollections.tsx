"use client";

import { Sparkles, Headphones, Activity, Coffee, Home, Heart, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const CATEGORIES = [
  {
    id: "beauty",
    title: "Skincare & Beauty",
    count: "120+ Drops",
    badge: "Most Popular",
    icon: Sparkles,
    color: "from-pink-500/10 to-rose-500/5",
    iconColor: "text-rose-500",
    borderHover: "hover:border-rose-400/50"
  },
  {
    id: "tech",
    title: "Tech & Audio",
    count: "45+ Drops",
    badge: "Trending",
    icon: Headphones,
    color: "from-blue-500/10 to-indigo-500/5",
    iconColor: "text-blue-500",
    borderHover: "hover:border-blue-400/50"
  },
  {
    id: "health",
    title: "Health & Nutrition",
    count: "70+ Drops",
    badge: "High Reward",
    icon: Activity,
    color: "from-emerald-500/10 to-teal-500/5",
    iconColor: "text-emerald-500",
    borderHover: "hover:border-emerald-400/50"
  },
  {
    id: "gourmet",
    title: "Gourmet & Snacks",
    count: "55+ Drops",
    badge: "Daily Drops",
    icon: Coffee,
    color: "from-amber-500/10 to-orange-500/5",
    iconColor: "text-amber-500",
    borderHover: "hover:border-amber-400/50"
  },
  {
    id: "home",
    title: "Home & Lifestyle",
    count: "35+ Drops",
    badge: "Premium",
    icon: Home,
    color: "from-purple-500/10 to-violet-500/5",
    iconColor: "text-purple-500",
    borderHover: "hover:border-purple-400/50"
  },
  {
    id: "personal",
    title: "Personal Grooming",
    count: "60+ Drops",
    badge: "Fast Refund",
    icon: Heart,
    color: "from-red-500/10 to-orange-500/5",
    iconColor: "text-red-500",
    borderHover: "hover:border-red-400/50"
  },
];

export function SampleCollections() {
  return (
    <section className="py-20 bg-gray-50/50 relative overflow-hidden border-t border-gray-100">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
              Curated Collections
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              Explore by Category
            </h2>
          </div>
          <Link 
            href="/browse" 
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            Browse All 350+ Live Samples <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        {/* Responsive 21st.dev category grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {CATEGORIES.map((c, i) => {
            const IconComponent = c.icon;
            return (
              <Link key={i} href={`/browse?category=${encodeURIComponent(c.id)}`} className="group">
                <motion.div 
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs hover:shadow-md ${c.borderHover} transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden`}
                >
                  <div className={`absolute -right-4 -top-4 w-16 h-16 bg-gradient-to-br ${c.color} rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500`} />
                  
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <IconComponent className={`w-5 h-5 ${c.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-gray-400 block mb-1">
                      {c.count}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug group-hover:text-red-600 transition-colors">
                      {c.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-gray-500">
                      {c.badge}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

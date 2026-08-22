"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { MagicCard } from "./ui/MagicCard";
import { ShinyText } from "./ui/ShinyText";

const TRENDING_ITEMS = [
  {
    tag: "HYDRATING",
    title: "Tender Coconut Water - 1L",
    price: "₹10",
    originalPrice: "₹187",
    image: "https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=400&auto=format&fit=crop"
  },
  {
    tag: "MINI PACK",
    title: "Anti-Aging Serum Pack",
    price: "₹49",
    originalPrice: "₹299",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&auto=format&fit=crop"
  },
  {
    tag: "ORGANIC",
    title: "Snack Bar Multipack",
    price: "₹25",
    originalPrice: "₹150",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop"
  }
];

export function TrendingDeals() {
  const [timeLeft, setTimeLeft] = useState("08:21:07");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let [h, m, s] = prev.split(":").map(Number);
        if (s > 0) s--;
        else {
          s = 59;
          if (m > 0) m--;
          else {
            m = 59;
            if (h > 0) h--;
          }
        }
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-32 bg-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div>
            <h2 className="text-[40px] font-black tracking-tighter text-gray-900 leading-none mb-4">
              Trending <ShinyText text="Today" />
            </h2>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed">Discover the most sought-after sample drops happening right now, before they run out.</p>
          </div>
          
          <div className="flex items-center bg-white/60 backdrop-blur-xl px-6 py-3 rounded-full border border-gray-200/50 shadow-sm">
            <span className="text-[11px] text-gray-500 uppercase font-bold tracking-widest mr-4">Ends In</span>
            <span className="font-mono font-bold text-lg text-gray-900">{timeLeft}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TRENDING_ITEMS.map((item, idx) => (
            <MagicCard key={idx} className="group cursor-pointer p-2 flex flex-col">
              <div className="w-full aspect-[4/3] bg-[#f8f9fa] rounded-[20px] mb-6 overflow-hidden relative">
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider text-gray-700 shadow-sm">
                  {item.tag}
                </div>
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover mix-blend-multiply opacity-80 group-hover:scale-105 transition-transform duration-700 ease-out" 
                />
              </div>
              
              <div className="flex justify-between items-start px-4 pb-4">
                <div>
                  <h3 className="font-bold text-[18px] text-gray-900 mb-2 tracking-tight leading-tight">{item.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tracking-tight text-gray-900">{item.price}</span>
                    <span className="text-[14px] text-gray-400 line-through font-medium">{item.originalPrice}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-[#eb5757] group-hover:text-white group-hover:border-[#eb5757] transition-all duration-300 shadow-sm mt-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </MagicCard>
          ))}
        </div>
      </div>
    </section>
  );
}

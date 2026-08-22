"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

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
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div>
            <h2 className="text-[36px] font-bold tracking-tighter text-gray-900 leading-none mb-4">
              Trending Today
            </h2>
            <p className="text-gray-500 text-sm max-w-sm">Discover the most sought-after sample drops happening right now.</p>
          </div>
          
          <div className="flex items-center bg-gray-50/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-100/50">
            <span className="text-[11px] text-gray-500 uppercase font-bold tracking-widest mr-4">Ends In</span>
            <span className="font-mono font-bold text-lg text-gray-900">{timeLeft}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TRENDING_ITEMS.map((item, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="w-full aspect-[4/3] bg-[#f8f9fa] rounded-3xl mb-6 overflow-hidden relative">
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider text-gray-600">
                  {item.tag}
                </div>
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover mix-blend-multiply opacity-80 group-hover:scale-105 transition-transform duration-700 ease-out" 
                />
              </div>
              
              <div className="flex justify-between items-start px-2">
                <div>
                  <h3 className="font-bold text-[16px] text-gray-900 mb-2 tracking-tight">{item.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold tracking-tight text-gray-900">{item.price}</span>
                    <span className="text-[13px] text-gray-400 line-through font-medium">{item.originalPrice}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#1a1a24] group-hover:text-white transition-colors duration-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

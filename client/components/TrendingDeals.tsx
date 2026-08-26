"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { MagicCard } from "./ui/MagicCard";
import { ShinyText } from "./ui/ShinyText";

import { api } from "@/lib/api";

interface Product {
  id: string;
  brand: string;
  product_name: string;
  product_image: string;
  real_price: number;
  offer_price: number;
  refund_amount: number;
  deal_type: string;
}

export function TrendingDeals() {
  const [timeLeft, setTimeLeft] = useState("08:21:07");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products/public", { requiresAuth: false });
        if (res.data) {
          // Take the first 3 products for trending section
          setProducts(res.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to load trending products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

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

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-24 bg-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
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
          {loading ? (
             <div className="col-span-3 text-center py-10 text-gray-500 text-sm tracking-widest uppercase">Loading latest drops...</div>
          ) : (
            products.map((item, idx) => (
              <MagicCard key={item.id} className="group cursor-pointer p-2 flex flex-col">
                <div className="w-full aspect-[4/3] bg-[#f8f9fa] rounded-[20px] mb-6 overflow-hidden relative">
                  <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider text-gray-700 shadow-sm uppercase">
                    {item.deal_type || item.brand}
                  </div>
                  <img 
                    src={item.product_image || "https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=400&auto=format&fit=crop"} 
                    alt={item.product_name} 
                    className="w-full h-full object-cover mix-blend-multiply opacity-80 group-hover:scale-105 transition-transform duration-700 ease-out" 
                  />
                </div>
                
                <div className="flex justify-between items-start px-4 pb-4">
                  <div>
                    <h3 className="font-bold text-[18px] text-gray-900 mb-2 tracking-tight leading-tight line-clamp-1">{item.product_name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold tracking-tight text-gray-900">₹{item.offer_price || 0}</span>
                      <span className="text-[14px] text-gray-400 line-through font-medium">₹{item.real_price || 0}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-[#eb5757] group-hover:text-white group-hover:border-[#eb5757] transition-all duration-300 shadow-sm mt-1 shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </MagicCard>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { api } from "@/lib/api";

interface Product {
  id: string;
  brand: string;
  product_name: string;
  product_image: string;
  real_price: number;
  offer_price: number;
}

export function HeroScroller() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products/public", { requiresAuth: false });
        if (res.data && res.data.length > 0) {
          setProducts(res.data.slice(0, 5)); // Take top 5 for hero
        }
      } catch (err) {
        console.error("Failed to load hero products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // If no products, show coming soon placeholders
  const displayItems = products.length > 0 ? products : [
    { id: "1", brand: "Sample Lelo", product_name: "Premium Samples Coming Soon", product_image: "https://images.unsplash.com/photo-1615397323209-b003a2c262c5?q=80&w=800&auto=format&fit=crop", real_price: 0, offer_price: 0 },
    { id: "2", brand: "Sample Lelo", product_name: "Exclusive Drops Weekly", product_image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop", real_price: 0, offer_price: 0 },
  ];

  // Duplicate items to create a seamless infinite loop
  const loopItems = [...displayItems, ...displayItems, ...displayItems];

  return (
    <div className="relative h-[400px] md:h-[500px] w-full max-w-[420px] mx-auto overflow-hidden rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.07)] border border-gray-100 bg-[#f8f6f5]">
      {/* Top and Bottom Fade Overlays */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#f8f6f5] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#f8f6f5] to-transparent z-10 pointer-events-none"></div>

      <motion.div 
        animate={{ y: ["0%", "-33.33%"] }}
        transition={{ repeat: Infinity, duration: displayItems.length * 5, ease: "linear" }}
        className="flex flex-col gap-4 p-4 pt-10"
      >
        {loopItems.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="relative w-full h-[400px] flex-shrink-0 bg-white rounded-[32px] overflow-hidden group cursor-pointer border border-gray-50 shadow-sm">
            <img 
              src={item.product_image || "https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=400"} 
              alt={item.product_name} 
              className="w-full h-full object-cover opacity-90 mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-out" 
            />
            
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <span className="bg-white/90 backdrop-blur-md text-black text-[10px] font-bold px-4 py-2 rounded-full shadow-sm tracking-widest uppercase">
                {products.length > 0 ? "Live Drop" : "Coming Soon"}
              </span>
              <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm">
                <Star className="w-4 h-4 text-black" fill="currentColor" />
              </div>
            </div>
            
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white/85 backdrop-blur-xl p-5 rounded-[20px] border border-white/50 shadow-lg">
                 <p className="text-[#eb5757] text-[10px] font-bold uppercase tracking-widest mb-1 line-clamp-1">{item.brand}</p>
                 <h3 className="text-xl font-black tracking-tighter text-gray-900 mb-1 line-clamp-1">{item.product_name}</h3>
                 
                 <div className="flex items-center justify-between mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-gray-900 tracking-tighter">
                        {item.offer_price === 0 ? "100% Free" : `₹${item.offer_price}`}
                      </span>
                    </div>
                    <div className="bg-black text-white text-xs font-bold px-4 py-2 rounded-full">
                      Claim
                    </div>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

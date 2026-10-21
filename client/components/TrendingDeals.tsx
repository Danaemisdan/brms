"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Clock, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { ShinyText } from "./ui/ShinyText";
import { Button } from "./ui/button";

interface Product {
  id: string;
  brand: string;
  product_name: string;
  product_image: string;
  platform?: string;
  real_price: number;
  offer_price: number;
  refund_amount: number;
  total_slots?: number;
  filled_slots?: number;
  deal_type?: string;
}

const FALLBACK_TRENDING: Product[] = [
  {
    id: "trend-1",
    brand: "GlowAura Organics",
    product_name: "Vitamin C Radiance Brightening Serum (30ml)",
    product_image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop",
    platform: "Amazon",
    real_price: 899,
    offer_price: 0,
    refund_amount: 899,
    total_slots: 50,
    filled_slots: 42,
    deal_type: "Daily Drop"
  },
  {
    id: "trend-2",
    brand: "SoundPulse Audio",
    product_name: "BassPro Wireless Active Noise-Cancelling Earbuds",
    product_image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop",
    platform: "Flipkart",
    real_price: 1499,
    offer_price: 0,
    refund_amount: 1499,
    total_slots: 75,
    filled_slots: 68,
    deal_type: "Exclusive"
  },
  {
    id: "trend-3",
    brand: "NutriVital Pro",
    product_name: "Organic Plant Protein & Superfood Blend (500g)",
    product_image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?q=80&w=800&auto=format&fit=crop",
    platform: "Amazon",
    real_price: 1199,
    offer_price: 0,
    refund_amount: 1199,
    total_slots: 60,
    filled_slots: 53,
    deal_type: "Hot Sample"
  }
];

export function TrendingDeals() {
  const [timeLeft, setTimeLeft] = useState("08:21:07");
  const [products, setProducts] = useState<Product[]>(FALLBACK_TRENDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products/public");
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json) ? json : json.data || json.products || [];
          if (items && items.length > 0) {
            setProducts(items.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Failed to load trending products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
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
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Background radial pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 sm:mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold uppercase tracking-wider mb-3">
              <Flame className="w-3.5 h-3.5" /> High Demand Samples
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-none">
              Trending <ShinyText text="Today" />
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mt-3 leading-relaxed">
              Real product drops from top verified brands. Order today, review upon delivery, and receive a 100% full refund directly into your UPI account.
            </p>
          </div>

          {/* Luxury Countdown Pill */}
          <div className="flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-lg border border-gray-800">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-400" /> Drop Closes In
              </span>
              <span className="font-mono font-bold text-lg tracking-wider text-white">{timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {products.map((item) => {
            const total = item.total_slots || 50;
            const filled = item.filled_slots || 38;
            const remaining = Math.max(0, total - filled);
            const percentage = Math.min(100, Math.round((filled / total) * 100));

            return (
              <div
                key={item.id}
                className="group flex flex-col bg-white rounded-3xl border border-gray-200/90 hover:border-gray-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Media Container */}
                <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
                  {/* Platform & Deal Badges */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                    <span className="bg-white/95 backdrop-blur-md text-[11px] font-bold px-2.5 py-1 rounded-full text-gray-800 shadow-sm border border-gray-100 uppercase tracking-wider">
                      {item.platform || "Amazon"}
                    </span>
                    <span className="bg-red-50/95 backdrop-blur-md text-[11px] font-bold px-2.5 py-1 rounded-full text-red-600 shadow-sm border border-red-100 uppercase tracking-wider">
                      {item.deal_type || "100% Refund"}
                    </span>
                  </div>

                  {/* Guarantee Pill */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Guaranteed
                    </span>
                  </div>

                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop";
                    }}
                  />
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Brand & Title */}
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    {item.brand}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-snug group-hover:text-red-600 transition-colors mb-3">
                    {item.product_name}
                  </h3>

                  {/* Slot Progress Bar */}
                  <div className="mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-gray-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" /> {remaining} Slots Left
                      </span>
                      <span className="text-gray-400 font-medium">{filled}/{total} Claimed</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Settlement Strip */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900">₹0</span>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Free Sample
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        MRP: <span className="line-through">₹{item.real_price}</span> • Full ₹{item.refund_amount} UPI Refund
                      </div>
                    </div>

                    <Link href={`/browse?q=${encodeURIComponent(item.brand)}`}>
                      <Button size="sm" className="bg-gray-900 hover:bg-red-600 text-white rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-1">
                        Claim <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Explorer Action */}
        <div className="text-center mt-12">
          <Link href="/browse">
            <Button variant="outline" className="rounded-full px-8 py-5 text-sm font-bold border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm gap-2">
              Browse All Active Drops <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
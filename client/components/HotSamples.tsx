"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2, Star, Zap } from "lucide-react";
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
  deal_type?: string;
  total_slots?: number;
  filled_slots?: number;
}

const FALLBACK_BENTO: Product[] = [
  {
    id: "bento-1",
    brand: "AromaBliss Home",
    product_name: "Ultrasonic Essential Oil Aromatherapy Diffuser & Humidifier",
    product_image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800&auto=format&fit=crop",
    platform: "Amazon",
    real_price: 1299,
    offer_price: 0,
    refund_amount: 1299,
    deal_type: "Featured Spotlight",
    total_slots: 40,
    filled_slots: 37
  },
  {
    id: "bento-2",
    brand: "SkinGlow Labs",
    product_name: "Deep Hydration Hyaluronic Acid Face Moisturizer Gel (50g)",
    product_image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop",
    platform: "Nykaa",
    real_price: 699,
    offer_price: 0,
    refund_amount: 699,
    deal_type: "Top Rated",
    total_slots: 50,
    filled_slots: 45
  },
  {
    id: "bento-3",
    brand: "RoasterCraft",
    product_name: "Single-Origin Dark Roast Artisan Coffee Beans (250g)",
    product_image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
    platform: "Amazon",
    real_price: 599,
    offer_price: 0,
    refund_amount: 599,
    deal_type: "Gourmet Drop",
    total_slots: 45,
    filled_slots: 39
  },
  {
    id: "bento-4",
    brand: "HydroTitan",
    product_name: "Double-Wall Vacuum Insulated Stainless Bottle (750ml)",
    product_image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop",
    platform: "Flipkart",
    real_price: 849,
    offer_price: 0,
    refund_amount: 849,
    deal_type: "Lifestyle",
    total_slots: 80,
    filled_slots: 71
  }
];

export function HotSamples() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_BENTO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products/public");
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json) ? json : json.data || json.products || [];
          if (items && items.length >= 4) {
            setProducts(items.slice(3, 7));
          } else if (items && items.length > 0) {
            setProducts([...items, ...FALLBACK_BENTO].slice(0, 4));
          }
        }
      } catch (err) {
        console.error("Failed to load hot bento samples:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const p0 = products[0] || FALLBACK_BENTO[0];
  const p1 = products[1] || FALLBACK_BENTO[1];
  const p2 = products[2] || FALLBACK_BENTO[2];
  const p3 = products[3] || FALLBACK_BENTO[3];

  return (
    <section className="py-20 md:py-28 bg-[#fbfbfe] relative overflow-hidden border-t border-gray-100">
      {/* Decorative gradient orb */}
      <div className="absolute top-1/2 right-0 w-[450px] h-[450px] bg-red-100/40 rounded-full blur-[130px] -translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 sm:mb-16 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Handpicked For Reviewers
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-none">
              Curated <ShinyText text="Spotlight" />
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mt-3 leading-relaxed">
              Explore premium products reserved for verified community members. Complete the quick review step and keep the item 100% free.
            </p>
          </div>

          <Link href="/browse" className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-bold text-sm px-6 py-3.5 rounded-full border border-gray-200/90 shadow-sm transition-all group">
            Explore All 200+ Samples <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 21st.dev Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Card 1: Large Primary Bento Card (Spans 2 cols, 2 rows on large screens) */}
          <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl border border-gray-200/90 hover:border-gray-300 shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {p0.platform || "Amazon"} Exclusive
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% UPI Settlement
                </span>
              </div>

              <div className="w-full aspect-[16/10] bg-gray-50 rounded-2xl overflow-hidden mb-6 relative">
                <img
                  src={p0.product_image}
                  alt={p0.product_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800&auto=format&fit=crop";
                  }}
                />
              </div>

              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                {p0.brand}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug mb-3 group-hover:text-red-600 transition-colors">
                {p0.product_name}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Test and review this premium aromatherapy unit. Once your Amazon review and return window screenshot are verified, receive ₹{p0.refund_amount} direct to your UPI.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-gray-900">₹0 <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Free Drop</span></div>
                <div className="text-xs text-gray-400">Regular MRP: ₹{p0.real_price}</div>
              </div>
              <Link href={`/browse?q=${encodeURIComponent(p0.brand)}`}>
                <Button className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl px-6 py-5 text-sm shadow-md gap-2">
                  Claim Sample <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 2: Wide Horizontal Card (Spans 2 cols, 1 row) */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-gray-200/90 hover:border-gray-300 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col sm:flex-row items-center gap-6 group">
            <div className="w-full sm:w-44 h-40 bg-gray-50 rounded-2xl overflow-hidden shrink-0 relative">
              <img
                src={p1.product_image}
                alt={p1.product_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop";
                }}
              />
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase">
                  {p1.platform || "Nykaa"}
                </span>
                <span className="text-[11px] font-semibold text-gray-400">{p1.brand}</span>
              </div>
              <h4 className="font-bold text-lg text-gray-900 tracking-tight line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                {p1.product_name}
              </h4>
              <div className="flex items-center justify-between mt-4">
                <div>
                  <span className="text-xl font-black text-gray-900">₹0</span>
                  <span className="text-xs text-gray-400 line-through ml-2">₹{p1.real_price}</span>
                </div>
                <Link href={`/browse?q=${encodeURIComponent(p1.brand)}`}>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold border-gray-200 hover:bg-gray-900 hover:text-white transition-all">
                    Apply Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Sleek Dark Tech Card */}
          <div className="md:col-span-1 bg-gray-900 text-white rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-lg group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> High Reward
              </div>
              <h4 className="text-xl font-bold tracking-tight text-white mb-2 line-clamp-2">
                {p2.product_name}
              </h4>
              <p className="text-xs text-gray-400 line-clamp-2 mb-4">
                {p2.brand} artisan roast. Complete the 5-star review step for full ₹{p2.refund_amount} refund.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-white">₹0</span>
                <span className="text-[11px] text-gray-400 block">₹{p2.refund_amount} UPI Return</span>
              </div>
              <Link href={`/browse?q=${encodeURIComponent(p2.brand)}`}>
                <div className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </Link>
            </div>
          </div>

          {/* Card 4: Compact Glass Card */}
          <div className="md:col-span-1 bg-white rounded-3xl border border-gray-200/90 hover:border-gray-300 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group">
            <div>
              <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-4 relative">
                <img
                  src={p3.product_image}
                  alt={p3.product_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop";
                  }}
                />
              </div>
              <div className="text-[11px] font-semibold text-gray-400 uppercase">{p3.brand}</div>
              <h4 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-red-600 transition-colors mt-0.5">
                {p3.product_name}
              </h4>
            </div>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
              <span className="text-lg font-black text-gray-900">₹0 <span className="text-xs line-through text-gray-400 font-normal">₹{p3.real_price}</span></span>
              <Link href={`/browse?q=${encodeURIComponent(p3.brand)}`}>
                <span className="text-xs font-bold text-red-600 hover:underline">Claim &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Flame, 
  Wallet, 
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  brand: string;
  product_name: string;
  product_image: string;
  platform: string;
  real_price: number;
  offer_price: number;
  refund_amount: number;
  total_slots: number;
  filled_slots: number;
  deal_type?: string;
}

// Fallback high-converting products with genuine e-commerce photography
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "sample-1",
    brand: "GlowAura Organics",
    product_name: "Vitamin C Radiance Brightening Serum (30ml)",
    product_image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop",
    platform: "Amazon",
    real_price: 899,
    offer_price: 0,
    refund_amount: 899,
    total_slots: 50,
    filled_slots: 42,
    deal_type: "Review Deal"
  },
  {
    id: "sample-2",
    brand: "SoundPulse Audio",
    product_name: "BassPro Wireless Active Noise-Cancelling Earbuds",
    product_image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop",
    platform: "Flipkart",
    real_price: 1499,
    offer_price: 0,
    refund_amount: 1499,
    total_slots: 75,
    filled_slots: 68,
    deal_type: "Review Deal"
  },
  {
    id: "sample-3",
    brand: "NutriVital Pro",
    product_name: "Organic Plant Protein & Superfood Blend (500g)",
    product_image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?q=80&w=800&auto=format&fit=crop",
    platform: "Amazon",
    real_price: 1199,
    offer_price: 0,
    refund_amount: 1199,
    total_slots: 60,
    filled_slots: 53,
    deal_type: "Review Deal"
  },
  {
    id: "sample-4",
    brand: "AromaBliss Home",
    product_name: "Ultrasonic Essential Oil Aromatherapy Diffuser",
    product_image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800&auto=format&fit=crop",
    platform: "Amazon",
    real_price: 1299,
    offer_price: 0,
    refund_amount: 1299,
    total_slots: 40,
    filled_slots: 37,
    deal_type: "Review Deal"
  }
];

// Rotating social proof ticker items
const LIVE_ACTIVITY = [
  { user: "Priya S. from Mumbai", action: "claimed Vitamin C Serum", time: "2m ago", saved: "₹899" },
  { user: "Arjun K. from Bengaluru", action: "received ₹1,499 UPI refund", time: "4m ago", saved: "₹1,499" },
  { user: "Neha R. from Delhi", action: "verified Earbuds Review", time: "6m ago", saved: "₹1,299" },
];

export function HeroSpotlight() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activityIdx, setActivityIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch real public products
  useEffect(() => {
    async function loadProducts() {
      try {
        let items: Product[] = [];
        const response = await fetch("/api/products/public");
        if (response.ok) {
          const json = await response.json();
          items = Array.isArray(json) ? json : json.data || json.products || [];
        }
        if (!items || items.length === 0) {
          try {
            const res2 = await fetch("/api/products");
            if (res2.ok) {
              const json2 = await res2.json();
              items = Array.isArray(json2) ? json2 : json2.data || json2.products || [];
            }
          } catch {}
        }
        if (items && items.length > 0) {
          setProducts(items);
        } else {
          setProducts(FALLBACK_PRODUCTS);
        }
      } catch (err) {
        console.error("Failed to fetch public hero products:", err);
        setProducts(FALLBACK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Auto-slide every 5 seconds unless hovered
  useEffect(() => {
    if (isPaused || products.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, products.length]);

  // Live social proof ticker cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setActivityIdx((prev) => (prev + 1) % LIVE_ACTIVITY.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentProduct = products[currentIndex] || FALLBACK_PRODUCTS[0];
  const nextProduct = products[(currentIndex + 1) % (products.length || 1)] || FALLBACK_PRODUCTS[1];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const slotsAvailable = Math.max(1, (currentProduct.total_slots || 50) - (currentProduct.filled_slots || 0));
  const percentFilled = Math.min(100, Math.round(((currentProduct.filled_slots || 0) / (currentProduct.total_slots || 50)) * 100));

  return (
    <div 
      className="relative w-full max-w-[500px] mx-auto select-none py-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Dynamic Ambient Backlight Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-gradient-to-tr from-[#eb5757]/30 via-orange-400/20 to-amber-300/10 rounded-full blur-[80px] pointer-events-none -z-10 animate-pulse"></div>

      {/* Floating Pill: Live Social Proof (Top-Left) */}
      <motion.div 
        key={activityIdx}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.4 }}
        className="absolute -top-3 left-2 sm:left-4 z-30 bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-lg px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs"
      >
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span className="text-gray-700 font-medium">
          <strong className="text-gray-900">{LIVE_ACTIVITY[activityIdx].user}</strong> {LIVE_ACTIVITY[activityIdx].action}
        </span>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full border border-emerald-100">
          Saved {LIVE_ACTIVITY[activityIdx].saved}
        </span>
      </motion.div>

      {/* Main 3D Stage Container */}
      <div className="relative w-full h-[480px] flex items-center justify-center perspective-[1200px]">
        {/* Background Deck Card (Visual Depth Illusion) */}
        <div 
          onClick={handleNext}
          className="absolute w-[88%] h-[430px] rounded-[32px] bg-gradient-to-br from-gray-100 via-white to-gray-200 border border-gray-200/70 shadow-lg -top-3 scale-95 translate-y-3 opacity-60 filter blur-[0.5px] cursor-pointer hover:opacity-80 transition-all pointer-events-auto"
        >
          <div className="p-4 flex justify-between items-center text-xs text-gray-400 font-medium">
            <span>Up Next: {nextProduct.brand}</span>
            <span className="font-bold">100% Free</span>
          </div>
        </div>

        {/* Active Hero Card with AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentProduct.id || currentIndex}
            initial={{ opacity: 0, scale: 0.94, y: 15, rotateX: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -15, rotateX: -6 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 w-full h-full bg-white rounded-[32px] overflow-hidden border border-gray-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] flex flex-col group"
          >
            {/* Top Image Showcase */}
            <div className="relative h-[62%] w-full bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={currentProduct.product_image || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop"}
                alt={currentProduct.product_name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop";
                }}
              />

              {/* Gradient Overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>

              {/* Badges Overlay */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                <span className="bg-white/95 backdrop-blur-md text-gray-900 font-bold text-[11px] px-3.5 py-1.5 rounded-full shadow-md tracking-wider uppercase flex items-center gap-1.5 border border-white/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {currentProduct.platform || "Amazon"} Verified
                </span>

                <span className="bg-red-500 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-full shadow-md tracking-wider flex items-center gap-1 animate-pulse">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  100% CASHBACK
                </span>
              </div>

              {/* Slots Urgency Bar */}
              <div className="absolute bottom-3 inset-x-4 z-10 bg-black/40 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 text-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Only <strong className="text-amber-400 font-bold">{slotsAvailable} slots</strong> left</span>
                </div>
                <div className="w-24 bg-white/20 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-red-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentFilled}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Bottom Content & Interactive CTA */}
            <div className="flex-1 p-5 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-red-500">
                    {currentProduct.brand}
                  </span>
                  <div className="flex items-center text-amber-500 text-xs gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-gray-400 text-[10px] ml-1">(4.9)</span>
                  </div>
                </div>

                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 line-clamp-1 tracking-tight">
                  {currentProduct.product_name}
                </h3>
              </div>

              {/* Price & Action Row */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">After Full Refund</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-900 tracking-tight text-emerald-600">
                      ₹0
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      ₹{currentProduct.real_price}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                      FREE
                    </span>
                  </div>
                </div>

                <Link href={`/register?submit=${currentProduct.id}`}>
                  <Button className="bg-[#eb5757] hover:bg-[#d64c4c] text-white font-bold rounded-xl px-5 h-10 shadow-md group-hover:shadow-lg transition-all flex items-center gap-1.5 text-xs">
                    Claim Deal <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={handlePrev}
          aria-label="Previous product"
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-xl border border-gray-200/80 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next product"
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-xl border border-gray-200/80 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Interactive Dots Pagination & Live Product Counter */}
      <div className="flex items-center justify-between px-4 mt-3">
        <div className="flex items-center gap-1.5">
          {products.slice(0, 6).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === idx 
                  ? "w-7 bg-[#eb5757]" 
                  : "w-2 bg-gray-200 hover:bg-gray-300"
              }`}
              aria-label={`Go to product ${idx + 1}`}
            />
          ))}
        </div>

        <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>{currentIndex + 1} of {products.length} live drops</span>
        </div>
      </div>

      {/* Floating Bottom Trust Pill */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 bg-gray-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl flex items-center justify-between text-xs shadow-xl border border-gray-800"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-gray-200">Guaranteed UPI Refund</span>
            <span className="text-[10px] text-gray-400 block">Settled within 15 days of order confirmation</span>
          </div>
        </div>

        <Link href="/browse" className="text-red-400 hover:text-red-300 font-semibold text-[11px] flex items-center gap-1">
          View all ➔
        </Link>
      </motion.div>
    </div>
  );
}

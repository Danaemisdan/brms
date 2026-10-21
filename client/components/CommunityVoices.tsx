"use client";

import { motion } from "framer-motion";
import { Star, ShieldCheck, CheckCircle2, ArrowRight, Sparkles, Quote } from "lucide-react";
import Link from "next/link";

interface Voice {
  author: string;
  location: string;
  role: string;
  product: string;
  platform: string;
  saved: string;
  rating: number;
  quote: string;
  avatarSeed: string;
}

const REVIEWS: Voice[] = [
  {
    author: "Priya Sharma",
    location: "Mumbai, MH",
    role: "Verified Sampler",
    product: "Vitamin C Brightening Serum (30ml)",
    platform: "Amazon",
    saved: "₹899 Refunded",
    rating: 5,
    quote: "Was honestly skeptical about '100% free products' at first. Ordered through Amazon, submitted my review screenshot once delivered, and got the full ₹899 credited straight to my UPI within 48 hours. Zero hassle!",
    avatarSeed: "Priya"
  },
  {
    author: "Rohan Deshmukh",
    location: "Bengaluru, KA",
    role: "Verified Sampler",
    product: "BassPro Wireless ANC Earbuds",
    platform: "Flipkart",
    saved: "₹1,499 Refunded",
    rating: 5,
    quote: "The slot validation speed is unreal. As soon as I uploaded my order proof, the slot was reserved and I received an automated confirmation email. Tested the earbuds for a week, wrote an honest review, and received ₹1,499 in GPay.",
    avatarSeed: "Rohan"
  },
  {
    author: "Ananya Verma",
    location: "Delhi NCR",
    role: "Verified Sampler",
    product: "Organic Plant Protein & Superfood Blend",
    platform: "Amazon",
    saved: "₹1,199 Refunded",
    rating: 5,
    quote: "I've claimed 3 health and fitness samples so far! The tracking in the dashboard is super clear—you see exactly when your order is validating, confirmed, and approved. Best platform for testing new brands without spending a rupee.",
    avatarSeed: "Ananya"
  },
  {
    author: "Karthik Nair",
    location: "Hyderabad, TS",
    role: "Verified Sampler",
    product: "Ultrasonic Essential Oil Aromatherapy Diffuser",
    platform: "Amazon",
    saved: "₹1,299 Refunded",
    rating: 5,
    quote: "Transparent and legit. You pay upfront on the official brand store so the product is 100% authentic, and Sample Lelo reimburses the entire amount directly into your bank or UPI wallet. Super smooth payout process.",
    avatarSeed: "Karthik"
  },
  {
    author: "Sneha Patel",
    location: "Ahmedabad, GJ",
    role: "Verified Creator",
    product: "Luxury Skincare Night Elixir",
    platform: "Myntra",
    saved: "₹2,500 Reward Paid",
    rating: 5,
    quote: "The Creator Dashboard is amazing! I applied for an activity campaign, got shortlisted, uploaded my Instagram Reel link, and got the collab payout credited directly into my Creator Wallet. Love working with Sample Lelo!",
    avatarSeed: "Sneha"
  },
  {
    author: "Vikram Malhotra",
    location: "Pune, MH",
    role: "Verified Sampler",
    product: "Ergonomic Bluetooth Mechanical Keyboard",
    platform: "Flipkart",
    saved: "₹2,199 Refunded",
    rating: 5,
    quote: "Customer support is top notch. Needed help verifying my return window screenshot and the team approved my order within two hours. Payout came through UPI immediately. Highly recommend to all frequent shoppers!",
    avatarSeed: "Vikram"
  }
];

export function CommunityVoices() {
  return (
    <section className="py-24 bg-white relative overflow-hidden border-t border-gray-100" id="community">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-red-50/40 via-amber-50/30 to-blue-50/40 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-600 tracking-wide uppercase">
                Wall of Proof
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900">
              Loved by 18,000+ Samplers
            </h2>
            <p className="text-gray-500 text-sm md:text-base mt-2 max-w-lg">
              Real community reviews and verified UPI transaction receipts from samplers across India.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1 text-amber-500 justify-end">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-900 mt-1 block">4.9 / 5.0 Overall Rating</span>
              <span className="text-[11px] text-gray-400">Based on 12,400+ verified refunds</span>
            </div>

            <Link href="/register">
              <button className="px-5 py-2.5 rounded-full bg-gray-900 hover:bg-black text-white text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center gap-1.5">
                Join Community <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>

        {/* 21st.dev Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-lg hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/5 to-transparent rounded-bl-3xl pointer-events-none"></div>

              <div>
                {/* Header: User Avatar & Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${review.avatarSeed}&backgroundColor=f3f4f6`}
                      alt={review.author}
                      className="w-11 h-11 rounded-full border border-gray-200 bg-gray-50 object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 leading-tight">
                        {review.author}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {review.location}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200/60">
                    {review.platform}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <span className="text-[11px] font-bold text-gray-700 ml-1">Verified Sample</span>
                </div>

                {/* Quote */}
                <p className="text-xs text-gray-600 leading-relaxed font-sans mb-5">
                  &ldquo;{review.quote}&rdquo;
                </p>
              </div>

              {/* Bottom Proof Pill */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                <span className="text-[11px] font-medium text-gray-500 truncate max-w-[170px]" title={review.product}>
                  {review.product}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {review.saved}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

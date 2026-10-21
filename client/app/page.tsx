"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SampleCollections } from "@/components/SampleCollections";
import { CommunityVoices } from "@/components/CommunityVoices";
import { ShopByBrand } from "@/components/ShopByBrand";
import { TrendingDeals } from "@/components/TrendingDeals";
import { HotSamples } from "@/components/HotSamples";
import { TrustedPartners } from "@/components/TrustedPartners";
import { FaqSection } from "@/components/FaqSection";
import { 
  Search, 
  ShoppingBag, 
  PenTool, 
  DollarSign, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Wallet,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react";
import { ShinyText } from "@/components/ui/ShinyText";
import { VelocityScroll } from "@/components/ui/VelocityScroll";
import { HeroSpotlight } from "@/components/HeroSpotlight";

const POPULAR_CATEGORIES = [
  { label: "💄 Beauty & Skincare", href: "/browse?category=beauty" },
  { label: "🎧 Tech & Gadgets", href: "/browse?category=tech" },
  { label: "💊 Health & Protein", href: "/browse?category=health" },
  { label: "☕ Gourmet & Snacks", href: "/browse?category=gourmet" },
  { label: "👕 Fashion", href: "/browse?category=fashion" },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col min-h-screen bg-white selection:bg-[#eb5757] selection:text-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#fcfcfc] via-white to-gray-50/50 text-gray-900 pt-12 md:pt-16 pb-20 relative overflow-hidden border-b border-gray-100">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#eb5757]/10 via-orange-400/5 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-start"
          >
            {/* Live Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-100/80 mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-red-600 tracking-wide flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Over 50,000+ Free Samples Delivered
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[5.5rem] font-black leading-[1.04] mb-6 tracking-tighter text-[#1a1a24]">
              Discover <ShinyText text="New Brands." /><br />
              Sample for Free.
            </h1>
            
            <p className="text-base md:text-lg text-gray-600 mb-8 max-w-lg leading-relaxed tracking-tight">
              Order authentic products from top e-commerce brands, test them out, share your review, and receive <span className="font-bold text-gray-900">100% instant refunds</span> directly into your UPI wallet.
            </p>
            
            {/* High-Converting Search Bar */}
            <div className="flex w-full max-w-md items-center bg-white border border-gray-200/90 rounded-full p-1.5 mb-4 shadow-md hover:border-gray-300 transition-all focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
              <Search className="w-5 h-5 text-gray-400 ml-3.5 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search brands, products, or deals..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-gray-900 placeholder:text-gray-400 font-sans"
              />
              <Link href={searchQuery ? `/browse?q=${encodeURIComponent(searchQuery)}` : "/register"} className="flex-shrink-0">
                <Button className="bg-[#eb5757] hover:bg-[#d64c4c] text-white rounded-full px-6 py-5 text-sm font-semibold shadow-sm">
                  Explore
                </Button>
              </Link>
            </div>

            {/* Category Quick Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-xs text-gray-400 font-medium">Trending:</span>
              {POPULAR_CATEGORIES.map((cat, idx) => (
                <Link key={idx} href={cat.href}>
                  <span className="text-[11px] font-medium bg-gray-100/80 hover:bg-red-50 hover:text-red-600 text-gray-700 px-2.5 py-1 rounded-full transition-colors border border-gray-200/50">
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* Social Trust Metrics */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-100 w-full max-w-md">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm">S</div>
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm">A</div>
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm">R</div>
                </div>
                <div>
                  <div className="flex items-center text-amber-500 text-xs">
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <span className="ml-1 font-bold text-gray-900">4.9/5</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">18,000+ Verified Samplers</span>
                </div>
              </div>

              <div className="h-6 w-px bg-gray-200"></div>

              <div>
                <div className="text-xs font-bold text-emerald-600">₹1.5 Cr+</div>
                <div className="text-[10px] text-gray-400 font-medium">Refunds Settled</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center items-center relative w-full"
          >
            <HeroSpotlight />
          </motion.div>
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="bg-gray-950 text-white py-5 border-y border-gray-800/80 relative">
        <div className="container mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-gray-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Genuine Marketplace Brands (Amazon, Flipkart, Nykaa)</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Real-time Slot Allocation & Verification</span>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Instant UPI & Bank Wallet Settlements</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
            <span>Zero Fees for Reviewers • Keep Every Product</span>
          </div>
        </div>
      </section>

      {/* Velocity Scroll Section */}
      <section className="py-10 bg-[#161622] text-white overflow-hidden">
        <VelocityScroll 
          text="FREE SAMPLES • TOP BRANDS • DAILY DROPS •" 
          defaultVelocity={3} 
          className="text-[3rem] sm:text-[4rem] md:text-[5rem] font-black opacity-90"
        />
        <VelocityScroll 
          text="DISCOVER REWARDS • INSTANT REFUNDS • SHOP PREMIUM •" 
          defaultVelocity={-3} 
          className="text-[3rem] sm:text-[4rem] md:text-[5rem] font-black opacity-40 mt-1"
        />
      </section>

      {/* Process Section: Clear 4-Step Verified Workflow */}
      <section className="py-20 md:py-28 bg-[#fbfbfe] border-b border-gray-100" id="how-it-works">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest bg-red-50 border border-red-100 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Automated Verification Engine
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-tight">
              How Sample Lelo Works
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mt-3 leading-relaxed">
              Our 4-stage transparent lifecycle ensures you get genuine free products with guaranteed, automated financial settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg border border-amber-100">
                    01
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Initial Step
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                  Order Validating
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Select an active drop, purchase it on Amazon, Flipkart, or Nykaa, and upload your order screenshot to your dashboard.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-amber-700 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Slot Check in Progress
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg border border-emerald-100">
                    02
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Automated Signal
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  Order Confirmed
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Our admin team verifies your proof and confirms available slots. You instantly receive an official confirmation email.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmation Email Sent
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-lg border border-teal-100">
                    03
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Proof Review
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                  Review & Return SS
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Once delivered, post your genuine 5-star review. Upload the review proof and return window screenshot for approval.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-teal-700 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Order Approved
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-lg border border-purple-100">
                    04
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Instant Payout
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                  Wallet & UPI Payout
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  The 100% refund is credited to your internal wallet. Click withdraw to send funds straight to your UPI or bank account!
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-purple-700 font-semibold flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Instant UPI Withdrawal
              </div>
            </div>
          </div>

          <div className="text-center mt-14">
            <Link href="/register">
              <Button className="bg-[#eb5757] hover:bg-[#d64c4c] text-white rounded-full px-8 py-6 text-sm font-bold shadow-lg gap-2">
                Start Sampling for Free Today <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Collections & Deals */}
      <SampleCollections />
      <CommunityVoices />
      <ShopByBrand />
      <TrendingDeals />
      <HotSamples />
      <TrustedPartners />
      <FaqSection />

      {/* Luxury 21st.dev Bottom Call-To-Action Banner */}
      <section className="py-20 bg-gray-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-red-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Join Over 18,000+ Active Reviewers
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            Ready to Experience <span className="text-red-500">100% Free Sampling?</span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Create your reviewer account in 30 seconds. Discover daily drops from top brands, sample authentic products, and receive guaranteed UPI refunds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-[#eb5757] hover:bg-[#d64c4c] text-white font-bold rounded-full px-8 py-6 text-sm shadow-xl gap-2">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/browse" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-gray-700 bg-white/5 hover:bg-white/10 text-white font-bold rounded-full px-8 py-6 text-sm">
                Explore Sample Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

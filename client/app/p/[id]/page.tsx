"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductDetailPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-6 py-10">
        {/* Breadcrumbs */}
        <div className="text-[11px] text-gray-500 mb-10 flex items-center gap-2 font-medium">
          <Link href="/" className="hover:text-black transition-colors">Home</Link> 
          <span>&gt;</span> 
          <Link href="/browse" className="hover:text-black transition-colors">Samples</Link> 
          <span>&gt;</span> 
          <span className="text-gray-900 font-semibold">Sample Detail</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Product Image */}
          <div className="bg-[#e8e0d5] rounded-[24px] p-12 flex items-center justify-center aspect-[4/3] md:aspect-square overflow-hidden border border-[#d6ccbe]/30">
            <img 
              src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop" 
              alt="Brand Sample" 
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center max-w-md">
            <h1 className="text-[2rem] font-bold text-gray-900 leading-tight mb-2 tracking-tight">
              Brand A Sample Set
            </h1>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Deluxe Mini Kit
            </h2>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
              This includes sample 100% skin process concept review of macromanagement origin: from root natural environmental performance proteins and nutrition value. Find out basic choices with the most softness and other details.
            </p>
            
            <div className="mb-6">
              <span className="text-[13px] font-bold text-gray-900 block mb-1">Give us your honest thoughts after trying.</span>
              <span className="text-[11px] text-gray-500">(for logged in users)</span>
            </div>
            
            <Button className="bg-[#eb5757] hover:bg-[#d64c4c] text-white rounded-full py-6 text-[13px] font-bold w-full shadow-sm">
              Request Sample
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

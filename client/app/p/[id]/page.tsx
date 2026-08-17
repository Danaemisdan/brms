"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductDetailPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      {/* Breadcrumbs */}
      <div className="text-xs text-muted-foreground mb-8 flex items-center gap-2 font-semibold">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link> 
        <span>&gt;</span> 
        <span>Deals</span> 
        <span>&gt;</span> 
        <span className="text-foreground">Review Deal</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Product Image */}
        <div className="bg-[#e0d6c8] rounded-2xl p-12 flex items-center justify-center aspect-square">
          <img 
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop" 
            alt="Wireless Earbuds" 
            className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            Wireless Earbuds: 100%<br />Cashback for Review
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            The wireless earbuds 100% cashback deal review product for you. Get our amazing product free via a personal assured proper process and transaction rebate cashback soon as you review. Other products come out on standard devices and more details on our website and other details.
          </p>
          
          <div className="mb-4">
            <span className="text-sm font-bold text-foreground">Claim Review Spot (1 Left)</span>
          </div>
          
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-full py-6 text-sm font-semibold w-full sm:w-auto px-12 shadow-md">
            Claim Review Spot (1 Left)
          </Button>
        </div>
      </div>
    </div>
  );
}

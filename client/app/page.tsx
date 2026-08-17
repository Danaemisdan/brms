"use client";

import { motion } from "framer-motion";
import { Search, Package, Headphones, Scissors, User, Truck, Smartphone, Gift, ShoppingBag, ShoppingCart, PenTool, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";

const CATEGORIES = [
  { name: "Categories", icon: <Package className="w-8 h-8" strokeWidth={1.5} /> },
  { name: "Scars", icon: <Headphones className="w-8 h-8" strokeWidth={1.5} /> },
  { name: "Categories", icon: <Scissors className="w-8 h-8" strokeWidth={1.5} /> },
  { name: "Features", icon: <User className="w-8 h-8" strokeWidth={1.5} /> },
  { name: "Delivery", icon: <Truck className="w-8 h-8" strokeWidth={1.5} /> },
  { name: "Product", icon: <Smartphone className="w-8 h-8" strokeWidth={1.5} /> },
  { name: "Markethop", icon: <Gift className="w-8 h-8" strokeWidth={1.5} /> },
];

const FEATURED_DEALS = [
  {
    id: "1",
    title: "Wireless Earbuds: 100% Cashback for Review",
    price: "₹25.00",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300&auto=format&fit=crop",
    statusText: "160/160"
  },
  {
    id: "2",
    title: "Skincare Skincare Stiheare",
    price: "₹2300",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop",
    statusText: "Stk/160"
  },
  {
    id: "3",
    title: "Skincare Manic South Skincare Sitlots",
    price: "₹2500",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop",
    statusText: "Cdt/60"
  },
  {
    id: "4",
    title: "Wireless Earbuds: 100% Cashback for Review",
    price: "₹25.00",
    image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=300&auto=format&fit=crop",
    statusText: "Stk/160"
  }
];

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#1a1a24] text-white w-full rounded-b-[40px] pt-12 pb-20 px-6">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Sample Lelo: Get Free <br />Products & Review Deals
            </h1>
            <p className="text-gray-400 mb-8">
              Sample Lelo: Get Free Products & Review Deals
            </p>

            <div className="flex items-center w-full max-w-md bg-white rounded-full p-1 pl-4">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="flex-1 bg-transparent border-none focus:outline-none text-black px-3 text-sm"
              />
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-8">
                Search
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center"
          >
            {/* Hero Illustration Placeholder */}
            <div className="relative w-[400px] h-[300px] bg-[#2a2a36] rounded-2xl flex items-center justify-center p-8">
              <div className="text-gray-400 text-center">
                <p className="text-sm">Illustration Placeholder</p>
                <div className="flex gap-4 justify-center mt-4 text-4xl">
                  <span>👩‍💻</span><span>🎧</span><span>📱</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 container mx-auto px-6" id="categories">
        <h2 className="text-2xl font-bold mb-8">Categories</h2>
        <div className="flex flex-wrap gap-6 items-center">
          {CATEGORIES.map((category, index) => (
            <div key={index} className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#f3f0e9] flex items-center justify-center text-2xl shadow-sm border border-border">
                {category.icon}
              </div>
              <span className="text-xs font-semibold">{category.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Review Deals */}
      <section className="py-12 container mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Featured Review Deals</h2>
          <a href="/browse" className="text-primary text-sm font-semibold hover:underline">See All &gt;</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {FEATURED_DEALS.map((deal) => (
            <ProductCard key={deal.id} {...deal} isFeatured={true} />
          ))}
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-20 mt-12 mb-12">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-500 mb-16">Here's a simple transparent and money ear process.</p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-4 relative">
            <div className="flex flex-col items-center max-w-[200px]">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl mb-4 border border-border shadow-sm text-black">
                <ShoppingBag className="w-8 h-8 text-black" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold mb-2">Browse</h3>
              <p className="text-xs text-muted-foreground">Browse your preferred product</p>
            </div>
            <div className="hidden md:block text-gray-400 font-light text-xl">➔</div>
            
            <div className="flex flex-col items-center max-w-[200px]">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl mb-4 border border-border shadow-sm text-black">
                <ShoppingCart className="w-8 h-8 text-black" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold mb-2">Buy</h3>
              <p className="text-xs text-muted-foreground">Shop and buy your product</p>
            </div>
            <div className="hidden md:block text-gray-400 font-light text-xl">➔</div>
            
            <div className="flex flex-col items-center max-w-[200px]">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl mb-4 border border-border shadow-sm text-black">
                <PenTool className="w-8 h-8 text-black" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold mb-2">Review</h3>
              <p className="text-xs text-muted-foreground">Post a review for the product</p>
            </div>
            <div className="hidden md:block text-gray-400 font-light text-xl">➔</div>
            
            <div className="flex flex-col items-center max-w-[200px]">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl mb-4 border border-border shadow-sm text-black">
                <DollarSign className="w-8 h-8 text-black" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold mb-2">Earn</h3>
              <p className="text-xs text-muted-foreground">Earn your money back</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

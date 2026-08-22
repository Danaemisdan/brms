"use client";

import { ProductCard } from "@/components/ProductCard";

const FEATURED_SAMPLES = [
  { id: "1", title: "Anti-Aging Serum Mini", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop" },
  { id: "2", title: "Organic Snack Bar Mini", image: "https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=300&auto=format&fit=crop" },
  { id: "3", title: "Organic Snack Bar", image: "https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=300&auto=format&fit=crop" },
  { id: "4", title: "Anti-Aging Serum Mini", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop" },
  { id: "5", title: "Organic Serum Bar Mini", image: "https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=300&auto=format&fit=crop" },
  { id: "6", title: "Organic Snack Bar", image: "https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=300&auto=format&fit=crop" },
];

export default function BrowsePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-10 pb-4">
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Sample Directory</h1>
          <div className="flex gap-2">
            <select className="border border-gray-200 rounded-md px-4 py-2 text-xs font-semibold bg-white text-gray-700 outline-none hover:border-gray-300">
              <option>All Filters ⌄</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-56 flex-shrink-0">
            <div className="mb-10">
              <h3 className="font-bold text-sm mb-4 text-gray-900">Price</h3>
              <div className="h-1 w-full bg-gray-200 rounded relative">
                <div className="h-1 bg-[#eb5757] w-1/2 rounded absolute left-0">
                  <div className="w-3 h-3 rounded-full bg-[#eb5757] absolute right-0 -top-1"></div>
                </div>
              </div>
              <div className="flex justify-between mt-3 text-[11px] font-bold text-gray-600">
                <span>₹000</span>
                <span>₹1300</span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-4 text-gray-900">Category</h3>
              <div className="space-y-3">
                {['Minis', 'Full-Size', 'Tester Kits', 'Tester Kits', 'Categories', 'Others'].map((cat, i) => (
                  <label key={i} className="flex items-center gap-3 text-[13px] font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                    <input type="checkbox" className="w-[14px] h-[14px] rounded-sm border-gray-300 text-[#eb5757] focus:ring-[#eb5757] accent-[#eb5757]" />
                    {cat}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {FEATURED_SAMPLES.map((sample) => (
                <ProductCard key={sample.id} {...sample} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

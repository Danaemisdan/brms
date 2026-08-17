"use client";

import { ProductCard } from "@/components/ProductCard";

const FEATURED_DEALS = [
  { id: "1", title: "Wireless Earbuds: 100% Cashback for Review", price: "₹25.00", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300&auto=format&fit=crop", statusText: "Stk/160" },
  { id: "2", title: "Skincare Skincare Stiheare", price: "₹2500", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop", statusText: "Stk/160" },
  { id: "3", title: "Skincare Manic South Skincare Sitlots", price: "₹2500", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop", statusText: "Stk/160" },
  { id: "4", title: "Wireless Earbuds: 100% Cashback for Review", price: "₹25.00", image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=300&auto=format&fit=crop", statusText: "Stk/160" },
  { id: "5", title: "Skincare Skincare Stiheare", price: "₹2200", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop", statusText: "Stk/160" },
  { id: "6", title: "Skincare Manic South Skincare Sitlots", price: "₹2500", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop", statusText: "Stk/160" },
];

export default function BrowsePage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <h1 className="text-2xl font-bold">Browse Deals (Affiliate View)</h1>
        <div className="flex gap-2">
          <select className="border border-border rounded-md px-3 py-1 text-sm bg-card text-foreground">
            <option>All Filters ⌄</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="mb-8">
            <h3 className="font-bold mb-4">Price</h3>
            <div className="h-1 w-full bg-border rounded">
              <div className="h-1 bg-primary w-1/2 rounded relative">
                <div className="w-3 h-3 rounded-full bg-primary absolute right-0 -top-1"></div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-muted-foreground font-semibold">
              <span>₹000</span>
              <span>₹1300</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Category</h3>
            <div className="space-y-3">
              {['Categorys', 'Price', 'Product', 'Skincare', 'Skincare', 'Food', 'Music', 'Categories', 'Others'].map((cat, i) => (
                <label key={i} className="flex items-center gap-3 text-sm text-foreground cursor-pointer hover:text-primary transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary" />
                  {cat}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_DEALS.map((deal) => (
              <ProductCard key={deal.id} {...deal} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

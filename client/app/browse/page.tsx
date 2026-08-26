"use client";

import { useEffect, useState, Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";

interface Product {
  id: string;
  brand: string;
  product_name: string;
  product_image: string;
  real_price: number;
  offer_price: number;
}

function BrowsePageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const brandFilter = searchParams.get("brand");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products/public", { requiresAuth: false });
        if (res.data) {
          let data = res.data;
          
          if (categoryFilter) {
             data = data.filter((p: any) => p.platform?.toLowerCase() === categoryFilter.toLowerCase() || p.category?.toLowerCase() === categoryFilter.toLowerCase());
          }
          if (brandFilter) {
             data = data.filter((p: any) => p.brand?.toLowerCase() === brandFilter.toLowerCase());
          }
          
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryFilter, brandFilter]);

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
            {loading ? (
               <div className="text-center py-20 text-gray-400 font-semibold tracking-widest uppercase">Loading directory...</div>
            ) : products.length === 0 ? (
               <div className="text-center py-20 text-gray-400 font-semibold tracking-widest uppercase">No samples available at the moment.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {products.map((sample) => (
                  <ProductCard key={sample.id} {...sample} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500 uppercase tracking-widest text-sm">Loading directory...</div>}>
      <BrowsePageContent />
    </Suspense>
  );
}

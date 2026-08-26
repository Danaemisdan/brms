import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MagicCard } from "./ui/MagicCard";
import { ShinyText } from "./ui/ShinyText";
import { api } from "@/lib/api";

interface Product {
  id: string;
  brand: string;
  product_name: string;
  product_image: string;
  real_price: number;
  offer_price: number;
  refund_amount: number;
  deal_type: string;
}

export function HotSamples() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products/public", { requiresAuth: false });
        if (res.data) {
          // Take products index 3 to 6 (so they differ from trending deals)
          setProducts(res.data.slice(3, 7));
        }
      } catch (err) {
        console.error("Failed to load hot samples", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);
  return (
    <section className="py-32 bg-[#fcfcfc] relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-100/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="flex justify-between items-end mb-16">
          <h2 className="text-[40px] font-black tracking-tighter text-gray-900 leading-none">
            Curated <ShinyText text="For You" />
          </h2>
          <Link href="/browse" className="text-[14px] font-semibold text-gray-500 hover:text-black transition-colors flex items-center group bg-white border border-gray-200/50 rounded-full px-5 py-2.5 shadow-sm hover:shadow-md">
            Explore Collection <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Bento Grid Layout using MagicCards */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
          
          {loading ? (
            <div className="md:col-span-4 flex items-center justify-center text-gray-500 uppercase tracking-widest text-sm">Loading curated samples...</div>
          ) : (
            <>
              {/* Main Large Card (Spans 2 columns, 2 rows) */}
              {products[0] && (
                <MagicCard className="md:col-span-2 md:row-span-2 p-3 flex flex-col group cursor-pointer">
                  <div className="absolute top-8 right-8 z-10 bg-white/90 backdrop-blur-md text-xs font-bold px-4 py-2 rounded-full text-[#eb5757] shadow-sm">
                    Earn {products[0].refund_amount ? `₹${products[0].refund_amount}` : "100%"} Refund
                  </div>
                  <div className="flex-1 w-full bg-[#f3f0e9] rounded-[20px] mb-8 overflow-hidden relative">
                    <img src={products[0].product_image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"} alt={products[0].product_name} className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>
                  <div className="px-5 pb-5">
                    <h3 className="text-3xl font-black tracking-tighter mb-3">{products[0].product_name}</h3>
                    <p className="text-gray-500 text-[15px] mb-6 leading-relaxed max-w-md">Experience immersive quality with cashbacks on your first review. Limited time exclusive drop from {products[0].brand}.</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black tracking-tighter">₹{products[0].offer_price || 0}</span>
                      <span className="text-sm text-gray-400 line-through font-medium">₹{products[0].real_price || 0}</span>
                    </div>
                  </div>
                </MagicCard>
              )}

              {/* Top Right Card (Spans 2 cols, 1 row) */}
              {products[1] && (
                <MagicCard className="md:col-span-2 md:row-span-1 p-8 flex items-center gap-8 group cursor-pointer">
                  <div className="flex-1">
                      <div className="bg-[#eb5757]/10 text-[#eb5757] text-[10px] font-bold px-3 py-1.5 rounded-full inline-block mb-4 tracking-wider uppercase">{products[1].deal_type || "EXCLUSIVE"}</div>
                      <h3 className="text-2xl font-black tracking-tighter mb-2 line-clamp-1">{products[1].product_name}</h3>
                      <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">Claim your exclusive sample from {products[1].brand} today before stock runs out.</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black tracking-tighter">₹{products[1].offer_price || 0}</span>
                        <span className="text-sm text-gray-400 line-through font-medium">₹{products[1].real_price || 0}</span>
                      </div>
                  </div>
                  <div className="w-40 h-40 bg-[#fdf5f7] rounded-2xl flex-shrink-0 overflow-hidden">
                      <img src={products[1].product_image || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&auto=format&fit=crop"} alt={products[1].product_name} className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-110 transition-transform duration-700 ease-out" />
                  </div>
                </MagicCard>
              )}

              {/* Bottom Right Card 1 */}
              {products[2] && (
                <div className="md:col-span-1 md:row-span-1 bg-[#0a0a0f] text-white rounded-[24px] p-8 flex flex-col relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-500 shadow-2xl">
                  <h3 className="text-xl font-bold tracking-tight mb-2 z-10">{products[2].brand}</h3>
                  <p className="text-gray-400 text-[13px] mb-auto z-10 line-clamp-2">{products[2].product_name}</p>
                  <div className="mt-8 z-10">
                    <span className="text-3xl font-black tracking-tighter">₹{products[2].offer_price || 0}</span>
                  </div>
                  {/* Decorative glow */}
                  <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-green-500/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-green-500/30 transition-colors duration-500"></div>
                </div>
              )}

              {/* Bottom Right Card 2 */}
              {products[3] && (
                <MagicCard className="md:col-span-1 md:row-span-1 p-4 flex flex-col group cursor-pointer">
                  <div className="w-full flex-1 bg-[#f4f2f9] rounded-xl mb-4 overflow-hidden relative">
                      <img src={products[3].product_image || "https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=400&auto=format&fit=crop"} alt={products[3].product_name} className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-110 transition-transform duration-700 ease-out absolute inset-0" />
                  </div>
                  <div className="px-2 pb-2">
                    <h3 className="text-lg font-bold tracking-tight mb-1 line-clamp-1">{products[3].product_name}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xl font-black tracking-tighter">₹{products[3].offer_price || 0}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded font-bold">{products[3].brand}</span>
                    </div>
                  </div>
                </MagicCard>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HotSamples() {
  return (
    <section className="py-32 bg-[#fafafa]">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex justify-between items-end mb-16">
          <h2 className="text-[36px] font-bold tracking-tighter text-gray-900 leading-none">
            Curated For You
          </h2>
          <Link href="/browse" className="text-[14px] font-semibold text-gray-500 hover:text-black transition-colors flex items-center group">
            Explore Collection <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
          
          {/* Main Large Card (Spans 2 columns, 2 rows) */}
          <div className="md:col-span-2 md:row-span-2 bg-white rounded-[2rem] p-8 flex flex-col relative overflow-hidden group cursor-pointer border border-gray-100/50 hover:shadow-xl transition-shadow duration-500">
            <div className="absolute top-8 right-8 z-10 bg-white/80 backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-full text-[#eb5757]">
              Earn 3% Refund
            </div>
            <div className="flex-1 w-full bg-[#f3f0e9] rounded-2xl mb-8 overflow-hidden">
               <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop" alt="Earbuds" className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">boAt Premium Audio</h3>
              <p className="text-gray-500 text-sm mb-4">Experience immersive sound with 100% cashback on your first review.</p>
              <div className="flex items-center gap-3">
                 <span className="text-lg font-bold">₹899</span>
                 <span className="text-sm text-gray-400 line-through">₹1349</span>
              </div>
            </div>
          </div>

          {/* Top Right Card (Spans 2 cols, 1 row) */}
          <div className="md:col-span-2 md:row-span-1 bg-white rounded-[2rem] p-8 flex items-center gap-8 relative overflow-hidden group cursor-pointer border border-gray-100/50 hover:shadow-xl transition-shadow duration-500">
             <div className="flex-1">
                <div className="bg-[#eb5757]/10 text-[#eb5757] text-[10px] font-bold px-2.5 py-1 rounded-md inline-block mb-3">EXCLUSIVE</div>
                <h3 className="text-xl font-bold tracking-tight mb-2">TIRA Beauty Kit</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-1">Claim your exclusive sample kit today.</p>
                <div className="flex items-center gap-3">
                   <span className="text-lg font-bold">₹0</span>
                   <span className="text-sm text-gray-400 line-through">₹999</span>
                </div>
             </div>
             <div className="w-32 h-32 bg-[#fdf5f7] rounded-2xl flex-shrink-0 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&auto=format&fit=crop" alt="Beauty" className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-110 transition-transform duration-700 ease-out" />
             </div>
          </div>

          {/* Bottom Right Card 1 */}
          <div className="md:col-span-1 md:row-span-1 bg-[#1a1a24] text-white rounded-[2rem] p-6 flex flex-col relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-500 shadow-xl">
             <h3 className="text-lg font-bold tracking-tight mb-2">Mamaearth</h3>
             <p className="text-gray-400 text-xs mb-auto">Natural Hair Care Mini</p>
             <div className="mt-8">
               <span className="text-2xl font-bold">₹99</span>
             </div>
             {/* Decorative glow */}
             <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-500/20 blur-3xl rounded-full pointer-events-none"></div>
          </div>

          {/* Bottom Right Card 2 */}
          <div className="md:col-span-1 md:row-span-1 bg-white rounded-[2rem] p-6 flex flex-col relative overflow-hidden group cursor-pointer border border-gray-100/50 hover:shadow-xl transition-shadow duration-500">
             <div className="w-full h-24 bg-[#f4f2f9] rounded-xl mb-4 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=400&auto=format&fit=crop" alt="Snack" className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-110 transition-transform duration-700 ease-out" />
             </div>
             <h3 className="text-base font-bold tracking-tight mb-1">MyGlamm Set</h3>
             <div className="mt-auto">
               <span className="text-lg font-bold">₹0</span>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}

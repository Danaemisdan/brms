import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MagicCard } from "./ui/MagicCard";
import { ShinyText } from "./ui/ShinyText";

export function HotSamples() {
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
          
          {/* Main Large Card (Spans 2 columns, 2 rows) */}
          <MagicCard className="md:col-span-2 md:row-span-2 p-3 flex flex-col group cursor-pointer">
            <div className="absolute top-8 right-8 z-10 bg-white/90 backdrop-blur-md text-xs font-bold px-4 py-2 rounded-full text-[#eb5757] shadow-sm">
              Earn 3% Refund
            </div>
            <div className="flex-1 w-full bg-[#f3f0e9] rounded-[20px] mb-8 overflow-hidden relative">
               <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop" alt="Earbuds" className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out" />
            </div>
            <div className="px-5 pb-5">
              <h3 className="text-3xl font-black tracking-tighter mb-3">boAt Premium Audio</h3>
              <p className="text-gray-500 text-[15px] mb-6 leading-relaxed max-w-md">Experience immersive sound with 100% cashback on your first review. Limited time exclusive drop.</p>
              <div className="flex items-center gap-3">
                 <span className="text-2xl font-black tracking-tighter">₹899</span>
                 <span className="text-sm text-gray-400 line-through font-medium">₹1349</span>
              </div>
            </div>
          </MagicCard>

          {/* Top Right Card (Spans 2 cols, 1 row) */}
          <MagicCard className="md:col-span-2 md:row-span-1 p-8 flex items-center gap-8 group cursor-pointer">
             <div className="flex-1">
                <div className="bg-[#eb5757]/10 text-[#eb5757] text-[10px] font-bold px-3 py-1.5 rounded-full inline-block mb-4 tracking-wider">EXCLUSIVE</div>
                <h3 className="text-2xl font-black tracking-tighter mb-2">TIRA Beauty Kit</h3>
                <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">Claim your exclusive deluxe sample kit today before stock runs out.</p>
                <div className="flex items-center gap-3">
                   <span className="text-xl font-black tracking-tighter">₹0</span>
                   <span className="text-sm text-gray-400 line-through font-medium">₹999</span>
                </div>
             </div>
             <div className="w-40 h-40 bg-[#fdf5f7] rounded-2xl flex-shrink-0 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&auto=format&fit=crop" alt="Beauty" className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-110 transition-transform duration-700 ease-out" />
             </div>
          </MagicCard>

          {/* Bottom Right Card 1 */}
          <div className="md:col-span-1 md:row-span-1 bg-[#0a0a0f] text-white rounded-[24px] p-8 flex flex-col relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-500 shadow-2xl">
             <h3 className="text-xl font-bold tracking-tight mb-2 z-10">Mamaearth</h3>
             <p className="text-gray-400 text-[13px] mb-auto z-10">Natural Hair Care Mini</p>
             <div className="mt-8 z-10">
               <span className="text-3xl font-black tracking-tighter">₹99</span>
             </div>
             {/* Decorative glow */}
             <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-green-500/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-green-500/30 transition-colors duration-500"></div>
          </div>

          {/* Bottom Right Card 2 */}
          <MagicCard className="md:col-span-1 md:row-span-1 p-4 flex flex-col group cursor-pointer">
             <div className="w-full flex-1 bg-[#f4f2f9] rounded-xl mb-4 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=400&auto=format&fit=crop" alt="Snack" className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-110 transition-transform duration-700 ease-out absolute inset-0" />
             </div>
             <div className="px-2 pb-2">
               <h3 className="text-lg font-bold tracking-tight mb-1">MyGlamm Set</h3>
               <div className="mt-2">
                 <span className="text-xl font-black tracking-tighter">₹0</span>
               </div>
             </div>
          </MagicCard>

        </div>
      </div>
    </section>
  );
}

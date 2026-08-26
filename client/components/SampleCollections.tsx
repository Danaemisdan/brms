import { Droplet, Sparkles, Croissant, ShoppingCart, Gem, Gift } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const COLLECTIONS = [
  { icon: Droplet, title: "Skincare", color: "from-blue-100 to-cyan-50", iconColor: "text-blue-500" },
  { icon: Sparkles, title: "Fragrance", color: "from-purple-100 to-pink-50", iconColor: "text-purple-500" },
  { icon: Croissant, title: "Snacks", color: "from-orange-100 to-amber-50", iconColor: "text-orange-500" },
  { icon: ShoppingCart, title: "Ecodomas", color: "from-green-100 to-emerald-50", iconColor: "text-green-500" },
  { icon: Gem, title: "Jewelry", color: "from-rose-100 to-red-50", iconColor: "text-rose-500" },
  { icon: Gift, title: "Bundles", color: "from-indigo-100 to-blue-50", iconColor: "text-indigo-500" },
];

export function SampleCollections() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-[32px] md:text-[40px] font-black mb-4 text-[#111827] tracking-tighter">
            Explore Categories
          </h2>
          <p className="text-gray-500 max-w-md mx-auto font-medium">Discover tailored selections of premium samples.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-5xl mx-auto">
          {COLLECTIONS.map((c, i) => (
            <Link key={i} href={`/browse?category=${c.title}`}>
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-4 cursor-pointer group"
              >
                 <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[28px] bg-gradient-to-br ${c.color} flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:shadow-black/5 transition-all duration-300 relative overflow-hidden`}>
                   <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <c.icon className={`w-8 h-8 md:w-10 md:h-10 ${c.iconColor} stroke-[1.5px] relative z-10 group-hover:scale-110 transition-transform duration-300`} />
                 </div>
                 <span className="text-[14px] md:text-[15px] font-bold text-gray-700 tracking-tight group-hover:text-black transition-colors">
                   {c.title}
                 </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

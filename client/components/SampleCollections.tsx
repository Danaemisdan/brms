import { Droplets, Sparkles, Croissant, ShoppingCart, Gem, Gift } from "lucide-react";

const COLLECTIONS = [
  { icon: Droplets, title: "Skincare" },
  { icon: Sparkles, title: "Fragrance" },
  { icon: Croissant, title: "Snacks" },
  { icon: ShoppingCart, title: "Ecodomas" },
  { icon: Gem, title: "Jewelry" },
  { icon: Gift, title: "Bundles" },
];

export function SampleCollections() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-[32px] font-bold mb-16 text-center text-gray-900 tracking-tighter">
          Explore by Category
        </h2>
        
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-4xl mx-auto">
          {COLLECTIONS.map((c, i) => (
            <div key={i} className="group cursor-pointer flex items-center justify-center gap-3 bg-gray-50/50 hover:bg-gray-100 px-8 py-5 rounded-[2rem] border border-gray-100 hover:border-gray-200 transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-sm">
               <c.icon className="w-[18px] h-[18px] text-gray-400 group-hover:text-[#eb5757] transition-colors duration-300 stroke-[2px]" />
               <span className="text-[14px] font-semibold text-gray-500 group-hover:text-gray-900 tracking-tight transition-colors duration-300">
                 {c.title}
               </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Droplet, Sparkles, Croissant, ShoppingCart, Gem, Gift } from "lucide-react";

const COLLECTIONS = [
  { icon: Droplet, title: "Skincare" },
  { icon: Sparkles, title: "Fragrance" },
  { icon: Croissant, title: "Snacks" },
  { icon: ShoppingCart, title: "Ecodomas" },
  { icon: Gem, title: "Jewelry" },
  { icon: Gift, title: "Bundles" },
];

export function SampleCollections() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-[28px] font-bold mb-12 text-center text-[#111827] tracking-tight">
          Explore by Category
        </h2>
        
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {COLLECTIONS.map((c, i) => (
            <div key={i} className="flex items-center justify-center gap-3 bg-white px-8 py-4 rounded-full border border-gray-100 hover:border-gray-300 transition-colors cursor-pointer shadow-sm shadow-gray-50/50">
               <c.icon className="w-4 h-4 text-gray-400 stroke-[2px]" />
               <span className="text-[14px] font-semibold text-gray-600 tracking-tight">
                 {c.title}
               </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

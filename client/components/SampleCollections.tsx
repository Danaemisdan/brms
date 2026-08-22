import { Droplets, Sparkles, Croissant, ShoppingCart, Gem, Gift } from "lucide-react";

const COLLECTIONS = [
  { icon: Droplets, title: "Skincare Minis" },
  { icon: Sparkles, title: "Fragrance Discovery" },
  { icon: Croissant, title: "Snack Packs" },
  { icon: ShoppingCart, title: "Ecodomas" },
  { icon: Gem, title: "Fragrance Discovery" },
  { icon: Gift, title: "Snack Packs" },
];

export function SampleCollections() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-[26px] font-bold mb-14 text-gray-900 tracking-tight">Sample Collections</h2>
        <div className="flex flex-wrap justify-between md:justify-center gap-8 md:gap-16">
          {COLLECTIONS.map((c, i) => (
            <div key={i} className="flex flex-col items-center group cursor-pointer">
              <div className="w-[88px] h-[88px] bg-[#1a1a24] rounded-full flex items-center justify-center mb-5 relative shadow-[0_8px_30px_rgb(0,0,0,0.12)] group-hover:-translate-y-1 group-hover:shadow-[0_12px_40px_rgb(0,0,0,0.16)] transition-all duration-300">
                 {/* Subtle inner red border */}
                 <div className="absolute inset-[2px] border-[1.5px] border-[#eb5757]/40 rounded-full transition-colors group-hover:border-[#eb5757]/80"></div>
                 {/* Premium Icon */}
                 <c.icon className="w-8 h-8 text-white stroke-[1.5px] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-[13px] font-semibold text-center leading-tight text-gray-800 group-hover:text-black transition-colors">
                {c.title.split(' ').map((word, idx) => <span key={idx} className="block">{word}</span>)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

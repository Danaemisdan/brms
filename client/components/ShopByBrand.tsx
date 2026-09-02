import Link from "next/link";
import { motion } from "framer-motion";

const BRANDS = [
  { name: "Amazon", offer: "Upto 5% Refund", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", bgColor: "bg-white" },
  { name: "AJIO", offer: "Upto 8% Refund", logo: "https://www.google.com/s2/favicons?domain=ajio.com&sz=128", bgColor: "bg-white" },
  { name: "Nykaa", offer: "Upto 10% Refund", logo: "https://www.google.com/s2/favicons?domain=nykaa.com&sz=128", bgColor: "bg-white" },
  { name: "Tata CLiQ", offer: "Upto 4% Refund", logo: "https://www.google.com/s2/favicons?domain=tatacliq.com&sz=128", bgColor: "bg-white" },
  { name: "Mamaearth", offer: "Upto 12% Refund", logo: "https://www.google.com/s2/favicons?domain=mamaearth.in&sz=128", bgColor: "bg-white" },
];

export function ShopByBrand() {
  return (
    <section className="py-20 bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-end mb-16 max-w-5xl mx-auto">
          <div>
             <h2 className="text-[32px] font-black tracking-tighter text-[#111827] mb-2">Shop by Brand</h2>
             <p className="text-gray-500 font-medium">Browse offers from your favorite platforms.</p>
          </div>
          <Link href="/browse" className="text-[14px] font-bold text-[#eb5757] hover:text-[#d64c4c] transition-colors bg-white px-4 py-2 rounded-full shadow-sm">
            All Brands &rarr;
          </Link>
        </div>
        
        <div className="flex overflow-x-auto pb-6 gap-8 md:gap-12 scrollbar-hide md:justify-center max-w-5xl mx-auto">
          {BRANDS.map((brand, idx) => (
            <Link key={idx} href={`/browse?brand=${brand.name}`}>
              <motion.div 
                whileHover={{ y: -5 }}
                className="flex flex-col items-center min-w-[90px] cursor-pointer group"
              >
                <div className={`w-[90px] h-[90px] ${brand.bgColor} rounded-[28px] flex items-center justify-center mb-4 shadow-sm group-hover:shadow-xl transition-all duration-300 relative overflow-hidden border border-gray-100 p-4`}>
                  <img 
                    src={brand.logo} 
                    alt={brand.name} 
                    className="w-full h-full object-contain" 
                    onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${brand.name}&backgroundColor=fcfcfc&textColor=111827&bold=true` }}
                  />
                </div>
                <span className="font-bold text-[14px] text-gray-800 text-center mb-2 group-hover:text-black transition-colors">{brand.name}</span>
                <span className="text-[10px] font-bold text-[#00b341] tracking-wide text-center bg-[#e8faef] px-2.5 py-1.5 rounded-full">{brand.offer}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

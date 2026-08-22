import { ArrowRight } from "lucide-react";
import Link from "next/link";

const BRANDS = [
  { name: "Amazon", offer: "Upto 5% Refund", initial: "A", color: "bg-orange-100 text-orange-600" },
  { name: "AJIO", offer: "Upto 8% Refund", initial: "AJ", color: "bg-blue-100 text-blue-600" },
  { name: "Nykaa", offer: "Upto 10% Refund", initial: "N", color: "bg-pink-100 text-pink-600" },
  { name: "Tata CLiQ", offer: "Upto 4% Refund", initial: "TC", color: "bg-gray-100 text-gray-800" },
  { name: "FirstCry", offer: "Upto 6% Refund", initial: "F", color: "bg-yellow-100 text-yellow-700" },
  { name: "Mamaearth", offer: "Upto 12% Refund", initial: "M", color: "bg-green-100 text-green-700" },
  { name: "Tirabeauty", offer: "N/A", initial: "T", color: "bg-purple-100 text-purple-600" },
];

export function ShopByBrand() {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold font-heading">SHOP BY BRAND</h2>
          <Link href="/brands" className="text-sm font-semibold text-primary flex items-center hover:underline">
            ALL BRANDS <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-hide snap-x">
          {BRANDS.map((brand, idx) => (
            <div key={idx} className="flex flex-col items-center min-w-[120px] snap-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3 ${brand.color} shadow-sm border border-black/5`}>
                {brand.initial}
              </div>
              <span className="font-semibold text-sm text-center line-clamp-1">{brand.name}</span>
              <span className="text-xs text-green-600 font-medium mt-1 text-center bg-green-50 px-2 py-0.5 rounded-full">{brand.offer}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

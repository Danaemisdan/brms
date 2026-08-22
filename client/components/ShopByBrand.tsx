import Link from "next/link";

const BRANDS = [
  { name: "Amazon", offer: "Upto 5% Refund", initial: "A", color: "bg-orange-50/80 text-orange-600 border-orange-100" },
  { name: "AJIO", offer: "Upto 8% Refund", initial: "AJ", color: "bg-blue-50/80 text-blue-600 border-blue-100" },
  { name: "Nykaa", offer: "Upto 10% Refund", initial: "N", color: "bg-pink-50/80 text-pink-600 border-pink-100" },
  { name: "Tata CLiQ", offer: "Upto 4% Refund", initial: "TC", color: "bg-gray-50 text-gray-800 border-gray-200" },
  { name: "FirstCry", offer: "Upto 6% Refund", initial: "F", color: "bg-yellow-50/80 text-yellow-700 border-yellow-100" },
  { name: "Mamaearth", offer: "Upto 12% Refund", initial: "M", color: "bg-green-50/80 text-green-700 border-green-100" },
  { name: "Tirabeauty", offer: "N/A", initial: "T", color: "bg-purple-50/80 text-purple-600 border-purple-100" },
];

export function ShopByBrand() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-[26px] font-bold tracking-tight text-gray-900">Shop by Brand</h2>
          <Link href="/brands" className="text-[13px] font-bold text-[#eb5757] hover:text-[#d64c4c] transition-colors flex items-center">
            All Brands <span className="ml-1 text-lg leading-none">&rsaquo;</span>
          </Link>
        </div>
        
        <div className="flex overflow-x-auto pb-6 gap-8 scrollbar-hide snap-x">
          {BRANDS.map((brand, idx) => (
            <div key={idx} className="flex flex-col items-center min-w-[110px] snap-center group cursor-pointer">
              <div className={`w-[88px] h-[88px] rounded-full flex items-center justify-center text-[22px] font-bold mb-4 ${brand.color} border group-hover:-translate-y-1 transition-transform duration-300`}>
                {brand.initial}
              </div>
              <span className="font-semibold text-[13px] text-gray-900 text-center mb-2 line-clamp-1 group-hover:text-[#eb5757] transition-colors">{brand.name}</span>
              <span className="text-[10px] font-bold text-green-600 tracking-wide text-center bg-green-50/80 px-2.5 py-1 rounded-md">{brand.offer}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

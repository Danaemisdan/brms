import Link from "next/link";

const BRANDS = [
  { name: "Amazon", offer: "Upto 5% Refund", initial: "A", borderColor: "border-orange-200", textColor: "text-[#ff6b00]" },
  { name: "AJIO", offer: "Upto 8% Refund", initial: "AJ", borderColor: "border-blue-200", textColor: "text-[#0055ff]" },
  { name: "Nykaa", offer: "Upto 10% Refund", initial: "N", borderColor: "border-pink-200", textColor: "text-[#ff006a]" },
  { name: "Tata CLiQ", offer: "Upto 4% Refund", initial: "TC", borderColor: "border-gray-200", textColor: "text-[#111827]" },
  { name: "FirstCry", offer: "Upto 6% Refund", initial: "F", borderColor: "border-yellow-200", textColor: "text-[#cc8800]" },
  { name: "Mamaearth", offer: "Upto 12% Refund", initial: "M", borderColor: "border-green-200", textColor: "text-[#008833]" },
  { name: "Tirabeauty", offer: "N/A", initial: "T", borderColor: "border-purple-200", textColor: "text-[#8800ff]" },
];

export function ShopByBrand() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-16">
          <h2 className="text-[24px] font-bold tracking-tight text-[#111827]">Shop by Brand</h2>
          <Link href="/brands" className="text-[13px] font-bold text-[#eb5757] hover:text-[#d64c4c] transition-colors">
            All Brands &gt;
          </Link>
        </div>
        
        <div className="flex overflow-x-auto pb-6 gap-8 scrollbar-hide md:justify-center max-w-5xl mx-auto">
          {BRANDS.map((brand, idx) => (
            <div key={idx} className="flex flex-col items-center min-w-[80px] cursor-pointer">
              <div className={`w-[80px] h-[80px] bg-white rounded-full flex items-center justify-center text-[22px] font-bold mb-5 border ${brand.borderColor} ${brand.textColor}`}>
                {brand.initial}
              </div>
              <span className="font-bold text-[12px] text-[#111827] text-center mb-2">{brand.name}</span>
              <span className="text-[9px] font-bold text-[#00b341] tracking-wide text-center bg-[#e8faef] px-2 py-1 rounded-full">{brand.offer}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

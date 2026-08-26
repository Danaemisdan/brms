import Link from "next/link";

interface ProductCardProps {
  id: string;
  brand: string;
  product_name: string;
  product_image?: string;
  offer_price?: number;
  real_price?: number;
}

export function ProductCard({ id, brand, product_name, product_image, offer_price, real_price }: ProductCardProps) {
  return (
    <Link href={`/p/${id}`} className="group flex flex-col cursor-pointer">
      <div className="w-full aspect-square bg-[#e8e0d5] rounded-xl mb-3 flex items-center justify-center p-6 overflow-hidden transition-transform group-hover:-translate-y-1 relative">
        <div className="absolute top-2 left-2 z-10 bg-white/90 text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider text-gray-700">
          {brand}
        </div>
        <img 
          src={product_image || "https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=400&auto=format&fit=crop"} 
          alt={product_name} 
          className="w-full h-full object-contain mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" 
        />
      </div>
      <h3 className="font-semibold text-[13px] text-gray-900 leading-snug line-clamp-2 mb-1">
        {product_name}
      </h3>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-900">₹{offer_price || 0}</span>
        {real_price && <span className="text-[11px] text-gray-400 line-through">₹{real_price}</span>}
      </div>
    </Link>
  );
}

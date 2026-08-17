import Link from "next/link";
import { Heart, ExternalLink } from "lucide-react";

interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  image: string;
  statusText?: string;
  isFeatured?: boolean;
}

export function ProductCard({ id, title, price, image, statusText = "160/160", isFeatured = false }: ProductCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-full aspect-square bg-[#f3f0e9] rounded-xl mb-4 p-4 flex items-center justify-center overflow-hidden">
        {/* Status Badge */}
        <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
          {statusText}
        </div>
        
        {/* Heart Icon */}
        <button className="absolute top-3 right-3 text-muted-foreground hover:text-primary transition-colors z-10">
          <Heart className="w-5 h-5" />
        </button>

        {/* Product Image Placeholder */}
        <img src={image} alt={title} className="w-full h-full object-contain mix-blend-multiply" />
      </div>

      <div className="flex flex-col flex-grow">
        <h3 className="font-bold text-sm text-foreground line-clamp-2 mb-2">
          {title}
        </h3>
        <p className="font-bold text-sm text-foreground mb-4">{price}</p>
        
        <div className="mt-auto">
          <Link href={`/p/${id}`}>
            <button className="w-full bg-[#1a1a24] text-white hover:bg-[#1a1a24]/90 rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
              View Details <ExternalLink className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

interface ProductCardProps {
  id: string;
  title: string;
  price?: string;
  image: string;
  statusText?: string;
}

export function ProductCard({ id, title, image }: ProductCardProps) {
  return (
    <Link href={`/p/${id}`} className="group flex flex-col cursor-pointer">
      <div className="w-full aspect-square bg-[#e8e0d5] rounded-xl mb-3 flex items-center justify-center p-6 overflow-hidden transition-transform group-hover:-translate-y-1">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-contain mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" 
        />
      </div>
      <h3 className="font-semibold text-[13px] text-gray-900 leading-snug line-clamp-2">
        {title}
      </h3>
    </Link>
  );
}

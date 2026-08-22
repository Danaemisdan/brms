import { Button } from "@/components/ui/button";
import { Headphones, Sparkles, Leaf, Brush, Flame } from "lucide-react";
import Link from "next/link";

const SAMPLES = [
  {
    brand: "boAt Audio Store",
    brandInitial: "b",
    title: "boAt Audio Store – Earn Upto 3% Refund on all purchases today",
    price: "₹899",
    mrp: "₹1349",
    imageColor: "bg-red-50/50",
    iconColor: "text-red-400",
    icon: Headphones
  },
  {
    brand: "TIRABEAUTY",
    brandInitial: "T",
    title: "Tirabeauty Exclusive Skincare Kit – Claim your sample now",
    price: "₹0",
    mrp: "₹999",
    imageColor: "bg-pink-50/50",
    iconColor: "text-pink-400",
    icon: Sparkles
  },
  {
    brand: "Mamaearth",
    brandInitial: "M",
    title: "Mamaearth Natural Hair Care Kit Mini",
    price: "₹99",
    mrp: "₹499",
    imageColor: "bg-green-50/50",
    iconColor: "text-green-400",
    icon: Leaf
  },
  {
    brand: "MyGlamm",
    brandInitial: "M",
    title: "MyGlamm Liquid Lipstick Set – Free Sample",
    price: "₹0",
    mrp: "₹395",
    imageColor: "bg-purple-50/50",
    iconColor: "text-purple-400",
    icon: Brush
  }
];

export function HotSamples() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-[26px] font-bold tracking-tight text-gray-900 flex items-center">
            Hot Samples <Flame className="w-6 h-6 ml-3 text-[#eb5757]" />
          </h2>
          <Link href="/browse" className="text-[13px] font-bold text-[#eb5757] hover:text-[#d64c4c] transition-colors flex items-center">
            View All <span className="ml-1 text-lg leading-none">&rsaquo;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAMPLES.map((sample, idx) => (
            <div key={idx} className="bg-white border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
              <div className={`h-44 w-full ${sample.imageColor} flex items-center justify-center`}>
                <sample.icon className={`w-12 h-12 ${sample.iconColor} stroke-[1.5px]`} />
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-md bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold">
                    {sample.brandInitial}
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{sample.brand}</span>
                </div>
                
                <h3 className="font-bold text-[14px] text-gray-900 mb-6 line-clamp-2 leading-relaxed">{sample.title}</h3>
                
                <div className="mt-auto">
                  <div className="flex items-baseline gap-2 mb-5">
                    <span className="text-xl font-bold tracking-tight text-gray-900">{sample.price}</span>
                    <span className="text-[13px] text-gray-400 line-through font-medium">{sample.mrp}</span>
                  </div>
                  
                  <Button className="w-full bg-[#fdf3e7] hover:bg-[#faeedd] text-[#d98528] font-bold text-[12px] rounded-xl py-6 transition-colors shadow-none border-none">
                    EARN REFUND / Upto 3%
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

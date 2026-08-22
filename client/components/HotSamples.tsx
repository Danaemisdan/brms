import { Button } from "@/components/ui/button";
import Link from "next/link";

const SAMPLES = [
  {
    brand: "boAt Audio Store",
    brandInitial: "b",
    title: "boAt Audio Store – Earn Upto 3% Refund on all purchases today",
    price: "₹899",
    mrp: "₹1349",
    imageColor: "bg-red-50",
    bannerEmoji: "🎧"
  },
  {
    brand: "TIRABEAUTY",
    brandInitial: "T",
    title: "Tirabeauty Exclusive Skincare Kit – Claim your sample now",
    price: "₹0",
    mrp: "₹999",
    imageColor: "bg-pink-50",
    bannerEmoji: "✨"
  },
  {
    brand: "Mamaearth",
    brandInitial: "M",
    title: "Mamaearth Natural Hair Care Kit Mini",
    price: "₹99",
    mrp: "₹499",
    imageColor: "bg-green-50",
    bannerEmoji: "🌿"
  },
  {
    brand: "MyGlamm",
    brandInitial: "M",
    title: "MyGlamm Liquid Lipstick Set – Free Sample",
    price: "₹0",
    mrp: "₹395",
    imageColor: "bg-purple-50",
    bannerEmoji: "💄"
  }
];

export function HotSamples() {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold font-heading">HOT SAMPLES 🔥</h2>
          <Link href="/browse" className="text-sm font-semibold text-primary hover:underline">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAMPLES.map((sample, idx) => (
            <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow bg-white">
              <div className={`h-40 w-full ${sample.imageColor} flex items-center justify-center text-6xl`}>
                {sample.bannerEmoji}
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                    {sample.brandInitial}
                  </div>
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{sample.brand}</span>
                </div>
                
                <h3 className="font-semibold text-sm mb-4 line-clamp-2">{sample.title}</h3>
                
                <div className="mt-auto">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-lg font-bold">{sample.price}</span>
                    <span className="text-sm text-gray-400 line-through">{sample.mrp}</span>
                  </div>
                  
                  <Button className="w-full bg-pink-100 hover:bg-pink-200 text-pink-700 font-bold rounded-xl py-6">
                    EARN REFUND / Upto 3% Refund
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

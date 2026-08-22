"use client";

import { Clock, TrendingUp, Droplets, Sparkles, Croissant } from "lucide-react";
import { useEffect, useState } from "react";

const TRENDING_ITEMS = [
  {
    tag: "HYDRATING OFFER",
    title: "Tender Coconut Water - 1L",
    price: "₹10",
    originalPrice: "₹187",
    refund: "₹110 REFUND",
    icon: Droplets,
    bgColor: "bg-blue-50/50",
    iconColor: "text-blue-500"
  },
  {
    tag: "SKINCARE MINI",
    title: "Anti-Aging Serum Mini Pack",
    price: "₹49",
    originalPrice: "₹299",
    refund: "₹250 REFUND",
    icon: Sparkles,
    bgColor: "bg-amber-50/50",
    iconColor: "text-amber-500"
  },
  {
    tag: "HEALTHY SNACK",
    title: "Organic Snack Bar Multipack",
    price: "₹25",
    originalPrice: "₹150",
    refund: "₹125 REFUND",
    icon: Croissant,
    bgColor: "bg-green-50/50",
    iconColor: "text-green-500"
  }
];

export function TrendingDeals() {
  const [timeLeft, setTimeLeft] = useState("08:21:07");

  useEffect(() => {
    // Simple timer mock
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let [h, m, s] = prev.split(":").map(Number);
        if (s > 0) s--;
        else {
          s = 59;
          if (m > 0) m--;
          else {
            m = 59;
            if (h > 0) h--;
          }
        }
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 bg-[#fcfcfc]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <h2 className="text-[26px] font-bold tracking-tight text-gray-900 flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-[#eb5757]" /> Today's Trending
          </h2>
          <div className="flex items-center bg-white px-5 py-2.5 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100">
            <Clock className="w-4 h-4 text-[#eb5757] mr-2" />
            <span className="font-mono font-bold text-[15px]">{timeLeft}</span>
            <span className="text-[10px] text-gray-400 ml-3 uppercase font-bold tracking-wider">Ends In</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRENDING_ITEMS.map((item, idx) => (
            <div key={idx} className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex relative overflow-hidden group cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex-1 pr-6 flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider mb-3">{item.tag}</span>
                <h3 className="font-bold text-[15px] text-gray-900 mb-4 line-clamp-2 leading-snug">{item.title}</h3>
                
                <div className="mt-auto">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold tracking-tight text-gray-900">{item.price}</span>
                    <span className="text-[13px] text-gray-400 line-through font-medium">{item.originalPrice}</span>
                  </div>
                  <div className="inline-block bg-[#fdf3e7] text-[#d98528] text-[11px] font-bold px-2.5 py-1 rounded-md">
                    {item.refund}
                  </div>
                </div>
              </div>
              <div className={`w-[110px] h-[110px] rounded-2xl flex items-center justify-center ${item.bgColor}`}>
                <item.icon className={`w-10 h-10 ${item.iconColor} stroke-[1.5px]`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

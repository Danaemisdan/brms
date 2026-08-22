"use client";

import { Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const TRENDING_ITEMS = [
  {
    tag: "HYDRATING OFFER",
    title: "Tender Coconut Water - 1L",
    price: "₹10",
    originalPrice: "₹187",
    refund: "₹110 REFUND",
    image: "🥥",
    bgColor: "bg-blue-50"
  },
  {
    tag: "SKINCARE MINI",
    title: "Anti-Aging Serum Mini Pack",
    price: "₹49",
    originalPrice: "₹299",
    refund: "₹250 REFUND",
    image: "✨",
    bgColor: "bg-amber-50"
  },
  {
    tag: "HEALTHY SNACK",
    title: "Organic Snack Bar Multipack",
    price: "₹25",
    originalPrice: "₹150",
    refund: "₹125 REFUND",
    image: "🍫",
    bgColor: "bg-green-50"
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
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold font-heading flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-primary" /> TODAY'S TRENDING
          </h2>
          <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <Clock className="w-5 h-5 text-red-500 mr-2" />
            <span className="font-mono font-bold text-lg">{timeLeft}</span>
            <span className="text-xs text-gray-500 ml-2 uppercase font-semibold">Ends In</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRENDING_ITEMS.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex-1 pr-4 flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 tracking-wider mb-2">{item.tag}</span>
                <h3 className="font-bold text-lg mb-3 line-clamp-2 leading-tight">{item.title}</h3>
                
                <div className="mt-auto">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-bold">{item.price}</span>
                    <span className="text-sm text-gray-400 line-through">{item.originalPrice}</span>
                  </div>
                  <div className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                    {item.refund}
                  </div>
                </div>
              </div>
              <div className={`w-32 h-32 rounded-xl flex items-center justify-center text-5xl ${item.bgColor}`}>
                {item.image}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";

const PARTNERS = [
  "Amazon", "Google", "Blinkit", "Zepto", 
  "Swiggy", "Bigbasket", "Myntra", "Purplle", 
  "AJIO", "Meesho", "Nykaa", "Flipkart"
];

export function TrustedPartners() {
  return (
    <section className="py-24 bg-white overflow-hidden border-t border-gray-50">
      <div className="container mx-auto px-6 text-center mb-16">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">
          Our Trusted Marketplace Partners
        </h2>
      </div>
      
      {/* Infinite Marquee Container */}
      <div className="relative flex w-full overflow-hidden flex-nowrap items-center">
        {/* Left/Right Fade Masks */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        <motion.div
          className="flex whitespace-nowrap items-center gap-16 md:gap-32 pl-16 md:pl-32"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
        >
          {/* Duplicate the array to create seamless loop */}
          {[...PARTNERS, ...PARTNERS].map((partner, idx) => (
            <div key={idx} className="text-xl md:text-3xl font-black text-gray-200 tracking-tighter grayscale hover:grayscale-0 hover:text-gray-900 transition-colors duration-500 cursor-pointer">
              {partner}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

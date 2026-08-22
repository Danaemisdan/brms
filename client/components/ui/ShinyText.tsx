"use client";

import { motion } from "framer-motion";

export const ShinyText = ({ text, className = "" }: { text: string, className?: string }) => {
  return (
    <motion.span
      className={`relative inline-block overflow-hidden text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-400 to-gray-900 bg-[length:200%_100%] ${className}`}
      animate={{ backgroundPosition: ["100% 0", "-100% 0"] }}
      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
    >
      {text}
    </motion.span>
  );
};

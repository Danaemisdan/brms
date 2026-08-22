"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from "framer-motion";

// Helper function to wrap values
const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

interface VelocityScrollProps {
  text: string;
  defaultVelocity?: number;
  className?: string;
}

export function VelocityScroll({ text, defaultVelocity = 2, className = "" }: VelocityScrollProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  // We wrap between -20% and -45% to ensure seamless looping of the 4 duplicated spans
  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);

  const directionFactor = useRef<number>(1);
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * defaultVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * Math.abs(velocityFactor.get());

    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden m-0 whitespace-nowrap flex flex-nowrap leading-[0.8] tracking-[-0.02em]">
      <motion.div className="flex whitespace-nowrap flex-nowrap" style={{ x }}>
        <span className={`block mr-8 ${className}`}>{text}</span>
        <span className={`block mr-8 ${className}`}>{text}</span>
        <span className={`block mr-8 ${className}`}>{text}</span>
        <span className={`block mr-8 ${className}`}>{text}</span>
        <span className={`block mr-8 ${className}`}>{text}</span>
        <span className={`block mr-8 ${className}`}>{text}</span>
      </motion.div>
    </div>
  );
}

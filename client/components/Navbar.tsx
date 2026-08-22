"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  
  // Routes that should use the dark navbar
  const isDark = pathname?.startsWith("/p/") || pathname?.startsWith("/submit-review") || pathname?.startsWith("/dashboard");

  return (
    <nav className={cn(
      "w-full border-b transition-colors",
      isDark ? "bg-[#1a1a24] border-gray-800" : "bg-white border-gray-200"
    )}>
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img 
            src="/sample-lelo-logo.png" 
            alt="Sample Lelo Logo" 
            className={cn(
              "h-16 md:h-20 w-auto object-contain origin-left scale-[1.5]",
              isDark ? "invert brightness-0" : ""
            )}
          />
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className={cn("text-sm font-semibold transition-colors hover:text-primary", pathname === "/" ? "text-primary border-b-2 border-primary pb-1" : (isDark ? "text-white" : "text-black"))}>Home</Link>
          <Link href="/browse" className={cn("text-sm font-semibold transition-colors hover:text-primary", pathname === "/browse" ? "text-primary border-b-2 border-primary pb-1" : (isDark ? "text-white" : "text-black"))}>Sample Directory</Link>
          <Link href="/#how-it-works" className={cn("text-sm font-semibold transition-colors hover:text-primary", isDark ? "text-white" : "text-black")}>How to Get Samples</Link>
          <Link href="/#community" className={cn("text-sm font-semibold transition-colors hover:text-primary", isDark ? "text-white" : "text-black")}>Community</Link>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className={cn("text-sm font-bold hover:text-primary transition-colors", isDark ? "text-white" : "text-black")}>
            Log in
          </Link>
          {!isDark && pathname === "/" ? (
            <Button className="bg-primary text-white hover:bg-primary/90 rounded-full px-6 font-semibold shadow-md">
              Sign up
            </Button>
          ) : (
            <Link href="/submit-review">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-full px-6 font-semibold shadow-md">
                Submit Feedback
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="w-full bg-background border-b border-border">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/sample-lelo-logo.png" alt="Sample Lelo Logo" className="h-8 w-auto object-contain" />
          {/* <span className="text-2xl font-bold tracking-tight">sample lelo</span> */}
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-semibold text-primary">Home</Link>
          <Link href="/browse" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">Browse Deals</Link>
          <Link href="/#categories" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">categories</Link>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
            Log in
          </Link>
          <Link href="/submit-review">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 font-semibold">
              Submit Review
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

import Link from "next/link";
import { Instagram, Facebook, MessageCircle, Send, Linkedin } from "lucide-react";
import { TelegramLink } from "./TelegramLink";

export function Footer() {
  return (
    <footer className="bg-[#1a1a24] text-[#8a8a9d] py-16 border-t border-gray-800">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand & Description */}
        <div className="md:col-span-1">
          <img src="/sample-lelo-logo.png" alt="Sample Lelo Logo" className="h-28 md:h-32 w-auto mb-6 invert brightness-0 origin-left object-contain" />
          <p className="text-[13px] leading-relaxed pr-4">
            We help online stores build trust, get noticed, and sell more on every shopping website using smart technology and data.
          </p>
          <div className="flex gap-4">
            <a href="https://www.linkedin.com/company/sample-lelo/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#0077b5] hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://www.instagram.com/samplelelo.in/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E1306C] hover:text-white transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://facebook.com/share/1D2NZ1szk5/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Quick Links & Pages */}
        <div>
          <h4 className="font-bold text-lg mb-6">Quick Links</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><Link href="/browse" className="hover:text-primary transition-colors">Sample Directory</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-primary transition-colors">How to Get Samples</Link></li>
            <li><a href="https://brandforyou.in/brand-reputation-management/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Brand Reputation Management</a></li>
            <li><a href="https://brandforyou.in/marketplace-solutions/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Influencer Marketing</a></li>
          </ul>
        </div>

        {/* Community & Contact */}
        <div>
          <h4 className="font-bold text-lg mb-6">Join Community</h4>
          <ul className="space-y-4 text-sm text-gray-400 mb-8">
            <li>
              <TelegramLink />
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 hover:text-primary transition-colors">
                <MessageCircle className="w-5 h-5" /> WhatsApp Group
              </a>
            </li>
          </ul>

          <h4 className="font-bold text-lg mb-4">Contact Us</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="mailto:hello@samplelelo.in" className="hover:text-primary transition-colors">hello@samplelelo.in</a></li>
            <li className="leading-relaxed mt-2">
              Office Address: Khasra No. 266, UGF,<br /> 
              Chandan Hola, New Delhi 110074.
            </li>
          </ul>
        </div>

        {/* Latest Blogs */}
        <div>
          <h4 className="font-bold text-lg mb-6">Latest from Blog</h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li>
              <a href="#" className="hover:text-primary transition-colors flex flex-col group">
                <span className="font-semibold text-gray-200 group-hover:text-primary">How to maximize your refunds</span>
                <span className="text-xs mt-1 opacity-70">August 20, 2026</span>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors flex flex-col group">
                <span className="font-semibold text-gray-200 group-hover:text-primary">Top 10 skincare samples this week</span>
                <span className="text-xs mt-1 opacity-70">August 18, 2026</span>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors flex flex-col group">
                <span className="font-semibold text-gray-200 group-hover:text-primary">Understanding marketplace solutions</span>
                <span className="text-xs mt-1 opacity-70">August 15, 2026</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-6 mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
        <p>© 2026 Sample Lelo. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

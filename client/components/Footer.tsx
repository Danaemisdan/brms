export function Footer() {
  return (
    <footer className="w-full bg-[#1a1a24] text-white py-12 mt-auto">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <img src="/sample-lelo-logo.png" alt="Sample Lelo Logo" className="h-8 w-auto mb-4 invert brightness-0" />
          <p className="text-sm text-gray-400 max-w-sm">
            Discover the best free products and cashback deals. Join our community of reviewers today!
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="/" className="hover:text-primary transition-colors">Home</a></li>
            <li><a href="/browse" className="hover:text-primary transition-colors">Browse Deals</a></li>
            <li><a href="/#categories" className="hover:text-primary transition-colors">Categories</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-6 mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
        © 2024 Sample Lelo. All rights reserved.
      </div>
    </footer>
  );
}

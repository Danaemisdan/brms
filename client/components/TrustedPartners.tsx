const PARTNERS = [
  "Amazon", "Google", "Blinkit", "Zepto", 
  "Swiggy", "Bigbasket", "Myntra", "Purplle", 
  "AJIO", "Meesho", "Nykaa", "Flipkart"
];

export function TrustedPartners() {
  return (
    <section className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-xl font-bold font-heading text-gray-400 uppercase tracking-widest mb-10">
          OUR TRUSTED MARKETPLACE PARTNERS
        </h2>
        
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {PARTNERS.map((partner, idx) => (
            <div key={idx} className="text-lg md:text-xl font-bold text-gray-600">
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

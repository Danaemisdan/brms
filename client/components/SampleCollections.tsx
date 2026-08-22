const COLLECTIONS = [
  { icon: "🧴", title: "Skincare Minis" },
  { icon: "✨", title: "Fragrance Discovery" },
  { icon: "🍫", title: "Snack Packs" },
  { icon: "🛒", title: "Ecodomas" },
  { icon: "💍", title: "Fragrance Discovery" },
  { icon: "🎁", title: "Snack Packs" },
];

export function SampleCollections() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold mb-10 text-gray-900">Sample Collections</h2>
        <div className="flex gap-10 overflow-x-auto pb-6 scrollbar-hide">
          {COLLECTIONS.map((c, i) => (
            <div key={i} className="flex flex-col items-center min-w-[100px]">
              <div className="w-[84px] h-[84px] bg-[#1a1a24] text-red-400 rounded-full flex items-center justify-center text-4xl mb-4 relative shadow-[0_8px_30px_rgb(0,0,0,0.08)] group cursor-pointer hover:-translate-y-1 transition-transform">
                 <div className="absolute inset-0 border border-red-500/30 rounded-full scale-90 group-hover:scale-100 transition-transform"></div>
                 {c.icon}
              </div>
              <span className="text-sm font-semibold text-center leading-tight text-gray-800">{c.title.split(' ').map((word, idx) => <span key={idx} className="block">{word}</span>)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

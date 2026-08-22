import Link from "next/link";

const VOICES = [
  { quote: "Loved trying the new organic lotion! Highly recommend.", name: "- Amit A", extra: "'I havet samplited Highly recommend.'" },
  { quote: "Loved trying the new organic lotion! Highly recommend.", name: "- Amit A", extra: "'Loved trying the new new organle cermorten! Highly reoommend.'" },
  { quote: "Loved trying the new organic lotion! Highly recommend.", name: "- Amit A", extra: "'Loved trying the new new organic letion! Highly reoommend.'" },
  { quote: "Loved trying the new organic lotion! Highly recommend.", name: "- Amit A", extra: "'Loved trying the new new organic letion! Highly reoommend.'" },
];

export function CommunityVoices() {
  return (
    <section className="py-12 bg-white pb-20">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Community Voices</h2>
          <Link href="/community" className="text-sm font-bold text-primary hover:underline flex items-center">
            See All <span className="ml-1">&gt;</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VOICES.map((v, i) => (
            <div key={i} className="bg-[#f7f5ef] p-6 rounded-2xl flex flex-col min-h-[180px]">
              <p className="text-[13px] text-gray-800 font-medium leading-relaxed mb-3">"{v.quote}"</p>
              <p className="text-[13px] text-gray-800 font-medium leading-relaxed mb-6">{v.extra}</p>
              <p className="text-xs text-gray-500 mt-auto">{v.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

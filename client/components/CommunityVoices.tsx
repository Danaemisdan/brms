import Link from "next/link";

const VOICES = [
  {
    quote: "\"Loved trying the new organic lotion! Highly recommend.\"\n\n'I havet samplited Highly recommend.'",
    author: "- Amit A"
  },
  {
    quote: "\"Loved trying the new organic lotion! Highly recommend.\"\n\n'Loved trying the new new organle cermorten! Highly reoommend.'",
    author: "- Amit A"
  },
  {
    quote: "\"Loved trying the new organic lotion! Highly recommend.\"\n\n'Loved trying the new new organic letion! Highly reoommend.'",
    author: "- Amit A"
  },
  {
    quote: "\"Loved trying the new organic lotion! Highly recommend.\"\n\n'Loved trying the new new organic letion! Highly reoommend.'",
    author: "- Amit A"
  }
];

export function CommunityVoices() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-[24px] font-bold tracking-tight text-[#111827]">
            Community Voices
          </h2>
          <Link href="/community" className="text-[13px] font-bold text-[#eb5757] hover:text-[#d64c4c] transition-colors">
            See All &gt;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VOICES.map((voice, idx) => (
            <div key={idx} className="bg-[#fcfbf9] rounded-[20px] p-6 flex flex-col">
              <p className="text-[12px] font-medium text-gray-800 leading-relaxed mb-8 whitespace-pre-wrap">
                {voice.quote}
              </p>
              <span className="text-[12px] font-medium text-gray-400 mt-auto">
                {voice.author}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

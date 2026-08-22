"use client";

import { Star } from "lucide-react";

export default function SubmitReviewPage() {
  return (
    <div className="bg-[#f7f5ee] min-h-screen py-16 flex justify-center">
      <div className="w-full max-w-[500px] bg-white rounded-3xl p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-gray-900 tracking-tight">Submit Your Feedback</h1>
          <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed">
            Share Your Experience form given your tasks on this you Share Your Experience.
          </p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-gray-900 mb-2">1. Order/Request ID (optional/hidden)</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#eb5757] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-900 mb-2">2. Overall thoughts</label>
            <textarea 
              placeholder="Overall thoughts"
              rows={4}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-[11px] text-gray-500 focus:outline-none focus:border-[#eb5757] transition-colors resize-none placeholder:text-gray-400"
            ></textarea>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-gray-900 mb-2">3. What did you like about the product?</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-[11px] focus:outline-none focus:border-[#eb5757] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-900 mb-2">4. Would you purchase?</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-[11px] focus:outline-none focus:border-[#eb5757] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-900 mb-2">5. Star rating for the overall sample experience</label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 text-[#f5a623] fill-[#f5a623] cursor-pointer" />
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

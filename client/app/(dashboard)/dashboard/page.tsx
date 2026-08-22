"use client";

import { Star } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <h1 className="text-2xl font-bold mb-8 text-gray-900 tracking-tight">User Dashboard</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-10 gap-8">
          <button className="text-[#eb5757] font-bold border-b-2 border-[#eb5757] pb-2 text-[13px]">
            My Samples
          </button>
          <button className="text-gray-500 font-semibold hover:text-gray-800 pb-2 text-[13px] transition-colors">
            Completed Feedback
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sample Request Status (Left) */}
          <div className="flex-1">
            <h3 className="font-bold text-[13px] text-gray-900 mb-4 px-2">Sample Request Status</h3>
            <div className="bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-2xl overflow-hidden divide-y divide-gray-50">
              
              {/* Item 1 */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#e8e0d5] rounded-md overflow-hidden p-1 flex-shrink-0">
                    <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=100&auto=format&fit=crop" alt="Serum" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[13px] text-gray-900">Serum Mini (Shipped)</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Completed</p>
                  </div>
                </div>
                <div className="text-[13px] text-gray-900 font-medium">Shipped</div>
              </div>

              {/* Item 2 */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#e8e0d5] rounded-md overflow-hidden p-1 flex-shrink-0">
                    <img src="https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=100&auto=format&fit=crop" alt="Snack" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[13px] text-gray-900">Snack Bar (Requested)</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Requested</p>
                  </div>
                </div>
                <div className="text-[13px] text-gray-900 font-medium">Requested</div>
              </div>

              {/* Item 3 */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#e8e0d5] rounded-md overflow-hidden p-1 flex-shrink-0">
                    <img src="https://images.unsplash.com/photo-1548843232-4e5659837c73?q=80&w=100&auto=format&fit=crop" alt="Snack" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[13px] text-gray-900">Snack Bar (Requested)</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Requested</p>
                  </div>
                </div>
                <div className="text-[13px] text-gray-900 font-medium">Completed</div>
              </div>

            </div>
          </div>

          {/* My Feedback History (Right) */}
          <div className="flex-1">
            <h3 className="font-bold text-[13px] text-gray-900 mb-4 px-2">My Feedback History</h3>
            <div className="bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-2xl overflow-hidden divide-y divide-gray-50 p-4">
              
              <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
                <button className="bg-[#eb5757] hover:bg-[#d64c4c] text-white px-6 py-2 rounded-full text-[13px] font-semibold transition-colors">
                  Share Feedback
                </button>
                <span className="text-[13px] text-gray-900 font-medium">Completed</span>
              </div>

              {/* History Item 1 */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#e8e0d5] rounded-md overflow-hidden flex-shrink-0 p-1">
                    <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=100&auto=format&fit=crop" alt="Serum" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[12px] text-gray-900 leading-tight">Serum Mini (Shipped)</h4>
                    <p className="text-[11px] text-gray-900 font-bold mt-0.5">$35.60</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-[#f5a623] fill-[#f5a623]" />)}
                </div>
              </div>

              {/* History Item 2 */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#e8e0d5] rounded-md overflow-hidden flex-shrink-0 p-1">
                    <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=100&auto=format&fit=crop" alt="Skincare" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[12px] text-gray-900 leading-tight">Skincare 100% (Requested)</h4>
                    <p className="text-[11px] text-gray-900 font-bold mt-0.5">$25.00</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-[#f5a623] fill-[#f5a623]" />)}
                </div>
              </div>

              {/* History Item 3 */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#e8e0d5] rounded-md overflow-hidden flex-shrink-0 p-1">
                    <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=100&auto=format&fit=crop" alt="Item" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[12px] text-gray-900 leading-tight">Kamoon Lebon Nich Setlow</h4>
                    <p className="text-[11px] text-gray-900 font-bold mt-0.5">$10.00</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-[#f5a623] fill-[#f5a623]" />)}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

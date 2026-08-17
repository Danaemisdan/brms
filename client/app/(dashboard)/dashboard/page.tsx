"use client";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">User Dashboard</h1>

      {/* Tabs */}
      <div className="flex border-b border-border mb-8 gap-8">
        <button className="text-primary font-bold border-b-2 border-primary pb-2 px-2 text-sm">
          Active Deals
        </button>
        <button className="text-muted-foreground font-semibold hover:text-foreground pb-2 px-2 text-sm transition-colors">
          Completed Reviews
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content List */}
        <div className="flex-1 bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border font-bold text-sm">Active Deals</div>
          
          <div className="divide-y divide-border">
            {/* Item 1 */}
            <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#f3f0e9] rounded-lg p-1 flex-shrink-0">
                  <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=100&auto=format&fit=crop" alt="Earbuds" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Wireless Earbuds: 100% Cashback for Review</h4>
                  <p className="text-sm font-bold mt-1">₹25.00</p>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-sm mt-1 inline-block">100% cashback + complete</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-primary text-sm font-bold">Completed</div>
                <div className="text-[10px] text-muted-foreground mt-1 text-center">✓ Active</div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#f3f0e9] rounded-lg p-1 flex-shrink-0">
                  <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=100&auto=format&fit=crop" alt="Skincare" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Skincare 100% Cashback for Review</h4>
                  <p className="text-sm font-bold mt-1">₹28.00</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-foreground text-sm font-bold">Completed</div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#f3f0e9] rounded-lg p-1 flex-shrink-0">
                  <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=100&auto=format&fit=crop" alt="Skincare" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Korean Lebon Nick Setlow</h4>
                  <p className="text-sm font-bold mt-1">₹10.00</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-foreground text-sm font-bold">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-primary text-white rounded-2xl p-6 shadow-md text-center">
            <p className="text-sm font-semibold opacity-90 mb-2 text-left">Total Earned:</p>
            <h2 className="text-4xl font-bold">₹1500</h2>
          </div>
        </aside>
      </div>
    </div>
  );
}

"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubmitReviewPage() {
  return (
    <div className="container mx-auto px-6 py-12 flex justify-center">
      <div className="w-full max-w-xl bg-card border border-border shadow-sm rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Submit Your Feedback</h1>
          <p className="text-muted-foreground text-sm">
            Share Your Experience. Honest feedback helps everyone.
          </p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">1. Order/Request ID (optional/hidden)</label>
            <input 
              type="text" 
              className="w-full border border-border rounded-lg px-4 py-3 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">2. Overall thoughts</label>
            <textarea 
              placeholder="Overall thoughts..."
              rows={4}
              className="w-full border border-border rounded-lg px-4 py-3 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">3. What did you like about the product?</label>
            <textarea 
              rows={3}
              className="w-full border border-border rounded-lg px-4 py-3 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">4. Star rating for the overall sample experience</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-8 h-8 text-[#ffc107] fill-[#ffc107] cursor-pointer" />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input type="checkbox" id="deadline" className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary" />
            <label htmlFor="deadline" className="text-sm font-medium">I have honestly tested the product</label>
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6 font-bold text-lg">
            Submit Feedback
          </Button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubmitReviewPage() {
  return (
    <div className="container mx-auto px-6 py-12 flex justify-center">
      <div className="w-full max-w-xl bg-card border border-border shadow-sm rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Submit Your Review</h1>
          <p className="text-muted-foreground text-sm">
            A secure-looking form page within this product and secure tasked you so our account.
          </p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">Order ID</label>
            <input 
              type="text" 
              className="w-full border border-border rounded-lg px-4 py-3 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Review URL</label>
            <input 
              type="text" 
              placeholder="https://review.sample.com/dRL"
              className="w-full border border-border rounded-lg px-4 py-3 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Star rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-8 h-8 text-[#ffc107] fill-[#ffc107] cursor-pointer" />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input type="checkbox" id="deadline" className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary" />
            <label htmlFor="deadline" className="text-sm font-medium">Submission deadline this time</label>
          </div>

          <div className="bg-[#f3f0e9] rounded-lg p-4 text-center">
            <p className="font-bold text-sm">Submission Deadline : <span className="text-primary">1 Hour</span></p>
            <p className="text-xs text-muted-foreground mt-1">Last credited at 2:11:33 PM</p>
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6 font-bold text-lg">
            Submit Review
          </Button>
        </form>
      </div>
    </div>
  );
}

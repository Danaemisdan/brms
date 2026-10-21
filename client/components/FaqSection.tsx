"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, ShieldCheck, Zap, Wallet, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    category: "Order & Validation",
    question: "How does the Order Validation process work?",
    answer: "After selecting an active campaign and purchasing the product on Amazon, Flipkart, or Nykaa, upload your order confirmation screenshot to your dashboard. The order status will immediately show 'Order Validating'. Our team reviews each submission against active inventory slots to ensure authenticity."
  },
  {
    category: "Confirmation",
    question: "When do I receive my official Order Confirmation email?",
    answer: "Customers receive an automated email confirmation only after their submitted order has been manually reviewed and verified by our admin team. Once verified, the order status updates to 'Order Confirmed' and your refund slot is officially guaranteed."
  },
  {
    category: "Slots & Rejection",
    question: "What happens if all campaign slots are already filled?",
    answer: "If inventory slots for a product are exhausted before your submission is approved, the order status updates to 'Order Rejected (No More Slots)'. In this case, you can simply cancel or return the item on the e-commerce platform with zero financial penalty."
  },
  {
    category: "Refunds & Settlement",
    question: "How and when do I receive my 100% refund?",
    answer: "Once the item is delivered, share your honest review on the platform and submit two proofs: (1) Review Screenshot and (2) Return Window Screenshot. Your status updates to 'Order Approved' and enters 'Refund Processing (15 days of Order Confirmation)'. The 100% refund is then credited directly to your internal wallet balance, which you can redeem instantly to your UPI ID or bank account."
  },
  {
    category: "Creator Program",
    question: "How do creators qualify for high-tier campaigns and Reel payouts?",
    answer: "Creators submit their social profile for verification through the Creator Dashboard. Once approved and categorized based on audience and engagement, you can apply for exclusive creator activities. Shortlisted creators submit their Reel link within the timeline; upon approval, compensation is credited to your Creator Wallet for immediate UPI withdrawal."
  },
  {
    category: "Fees & Trust",
    question: "Are there any hidden fees or charges for reviewers?",
    answer: "Zero. Sample Lelo is 100% free for verified reviewers and consumers. You pay upfront on the e-commerce platform and receive a full 100% refund credited back upon completing the honest review criteria."
  }
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-20 md:py-28 bg-white border-t border-gray-100" id="faq">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <div className="text-center max-w-xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" /> Clear Answers & Transparency
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 leading-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-2">
            Everything you need to know about our automated verification, slot allocation, and 100% UPI refund lifecycle.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-red-200 bg-red-50/20 shadow-sm"
                    : "border-gray-200/80 bg-white hover:border-gray-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100/60 px-2.5 py-1 rounded-md shrink-0">
                      {faq.category}
                    </span>
                    <span className="font-bold text-base sm:text-lg text-gray-900 leading-snug">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-red-500" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-1 text-sm text-gray-600 leading-relaxed border-t border-red-100/40">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
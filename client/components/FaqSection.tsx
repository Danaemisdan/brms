"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQS = [
  {
    question: "How do I get free samples?",
    answer: "Getting free samples is easy! Simply browse our Sample Directory, choose a product you like, and follow the instructions to purchase it from our partner site. Once you submit your order details and feedback, we will process your refund."
  },
  {
    question: "How long does it take to get a refund?",
    answer: "Refunds are typically processed within 48 to 72 hours after your feedback has been verified and approved by our team."
  },
  {
    question: "Is this completely free?",
    answer: "Yes! You purchase the product upfront, but once you provide honest feedback as per the instructions, you receive up to 100% refund as cashback, effectively making the sample free."
  },
  {
    question: "Where can I track my samples?",
    answer: "You can track the status of all your requested samples in your User Dashboard under the 'My Samples' tab."
  }
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-16 bg-white" id="faq">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl font-bold font-heading text-center mb-10">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full px-6 py-4 text-left flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                {openIdx === idx ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>
              {openIdx === idx && (
                <div className="px-6 py-4 bg-white text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

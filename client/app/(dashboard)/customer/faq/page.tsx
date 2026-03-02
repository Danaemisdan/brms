"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FAQPage() {
    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
                <p className="text-gray-500">Find answers to common questions about claiming, orders, and payouts.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Platform & Payout FAQs</CardTitle>
                    <CardDescription>Everything you need to know about how campaigns work.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-left font-medium">When will I receive my cash back?</AccordionTrigger>
                            <AccordionContent className="text-gray-600">
                                Refunds are typically processed within 48 to 72 hours after your order has been successfully delivered and your review proof has been verified by the automated system.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="text-left font-medium">How long does review verification take?</AccordionTrigger>
                            <AccordionContent className="text-gray-600">
                                Once you submit your review screenshot, our automated bot validates the review on the e-commerce platform usually within 24 hours. If it takes longer, please open a ticket with support.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="text-left font-medium">My bank transfer failed. What now?</AccordionTrigger>
                            <AccordionContent className="text-gray-600">
                                If your registered UPI ID or Bank Details are inaccurate, the automated payment will bounce. You can update your details in the "Payment Info" section, and the system will automatically attempt a retry during the next daily cycle.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger className="text-left font-medium">Do I need to leave a 5-star review?</AccordionTrigger>
                            <AccordionContent className="text-gray-600">
                                To qualify for a full campaign refund, most brands require a positive and detailed 5-star review along with images or video depending on their specific product instructions. Always follow the campaign guidelines.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                            <AccordionTrigger className="text-left font-medium">What happens if I cancel the order on Amazon/Flipkart after being paid?</AccordionTrigger>
                            <AccordionContent className="text-gray-600">
                                If an order is canceled or returned after a payout has been issued, our system will automatically flag the anomaly. Your account will be permanently banned from participating in any future campaigns across all brands.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}

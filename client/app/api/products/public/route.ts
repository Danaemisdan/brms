export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const mockCampaigns = [
            {
                id: "mock-1",
                product_name: "Nippon Paint - Glass Cleaner Spray",
                product_image: "https://images.unsplash.com/photo-1584820927498-cafe2c1c7669?q=80&w=800",
                brand: "Nippon Paints",
                real_price: 204,
                offer_price: 49,
                refund_amount: 155,
                total_slots: 100,
                filled_slots: 45,
                deadline: new Date(Date.now() + 86400000).toISOString(),
                deal_type: "RATING DEAL"
            },
            {
                id: "mock-2",
                product_name: "Premium Skincare Sample Kit",
                product_image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800",
                brand: "Glow & Co",
                real_price: 999,
                offer_price: 0,
                refund_amount: 999,
                total_slots: 50,
                filled_slots: 12,
                deadline: new Date(Date.now() + 172800000).toISOString(),
                deal_type: "REVIEW DEAL"
            },
            {
                id: "mock-3",
                product_name: "Organic Matcha Tea Powder",
                product_image: "https://images.unsplash.com/photo-1582793988951-9aed550c945e?q=80&w=800",
                brand: "Zen Leaf",
                real_price: 450,
                offer_price: 99,
                refund_amount: 351,
                total_slots: 200,
                filled_slots: 150,
                deadline: new Date(Date.now() + 259200000).toISOString(),
                deal_type: "EXCLUSIVE"
            },
            {
                id: "mock-4",
                product_name: "Wireless Noise-Canceling Earbuds",
                product_image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800",
                brand: "AudioTech",
                real_price: 2499,
                offer_price: 499,
                refund_amount: 2000,
                total_slots: 20,
                filled_slots: 19,
                deadline: new Date(Date.now() + 43200000).toISOString(),
                deal_type: "PREMIUM"
            },
            {
                id: "mock-5",
                product_name: "Vegan Protein Bar Combo",
                product_image: "https://images.unsplash.com/photo-1622484211148-52b3bd70b86a?q=80&w=800",
                brand: "FitBites",
                real_price: 300,
                offer_price: 0,
                refund_amount: 300,
                total_slots: 500,
                filled_slots: 420,
                deadline: new Date(Date.now() + 604800000).toISOString(),
                deal_type: "FREE SAMPLE"
            },
            {
                id: "mock-6",
                product_name: "Smart Fitness Watch",
                product_image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800",
                brand: "TrackFit",
                real_price: 1999,
                offer_price: 299,
                refund_amount: 1700,
                total_slots: 30,
                filled_slots: 5,
                deadline: new Date(Date.now() + 345600000).toISOString(),
                deal_type: "TESTING"
            }
        ];

        return NextResponse.json({ message: "Public campaigns fetched successfully", data: mockCampaigns }, { status: 200 });
    } catch (error) {
        console.error("Error fetching public campaigns:", error);
        return NextResponse.json({ error: "Error fetching campaigns" }, { status: 500 });
    }
}

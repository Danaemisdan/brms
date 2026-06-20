import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 selection:bg-blue-100">
      <main className="max-w-4xl w-full flex flex-col items-center text-center space-y-8 bg-white p-12 md:p-16 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-900/5">
        <div className="flex justify-center w-full mb-4">
          <img src="/logo.svg" alt="BRMS Logo" className="h-20 md:h-24 w-auto transform transition-transform hover:scale-105" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
          Brand Reputation <br className="hidden md:block" /> Management System
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl leading-relaxed">
          The centralized platform to manage product review campaigns, track customer order submissions, and process refunds effortlessly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-8 w-full justify-center max-w-md">
          <Link href="/login" className="flex-1 w-full sm:w-auto">
            <Button size="lg" className="w-full text-lg h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-md transition-all">
              Sign In
            </Button>
          </Link>
          <Link href="/register" className="flex-1 w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full text-lg h-14 border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 text-gray-700 transition-all">
              New Customer?
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-10 pt-6 border-t border-gray-100 w-full max-w-sm">
          Brand accounts must be created by an Administrator.
        </p>
      </main>
    </div>
  );
}

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <CardHeader className="space-y-4 text-center pb-6">
                    <div className="flex justify-center w-full">
                        <img src="/logo.svg" alt="BRMS Logo" className="h-16 w-auto" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight">Forgot Password?</CardTitle>
                        <CardDescription className="text-gray-500 mt-2">
                            Please contact your system Administrator to reset your password.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex justify-center pb-8">
                    <Link href="/login">
                        <Button variant="outline" className="w-full">
                            Return to Login
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

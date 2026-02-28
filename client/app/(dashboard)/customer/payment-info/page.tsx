"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function CustomerPaymentInfo() {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [paymentMethod, setPaymentMethod] = useState<"UPI" | "BANK">("UPI");
    const [upiId, setUpiId] = useState("");
    const [formData, setFormData] = useState({
        bank_account: "",
        ifsc_code: "",
        bank_name: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/users/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                if (json.user && json.user.encrypted_bank_data) {
                    const bankStr = json.user.encrypted_bank_data;
                    if (bankStr.includes("Bank AC:")) {
                        setPaymentMethod("BANK");
                        const acMatch = bankStr.match(/Bank AC:\s*([^,]+)/);
                        const ifscMatch = bankStr.match(/IFSC:\s*([^,]+)/);
                        const nameMatch = bankStr.match(/Name:\s*(.+)/);
                        setFormData({
                            bank_account: acMatch ? acMatch[1].trim() : "",
                            ifsc_code: ifscMatch ? ifscMatch[1].trim() : "",
                            bank_name: nameMatch ? nameMatch[1].trim() : ""
                        });
                    } else {
                        setPaymentMethod("UPI");
                        setUpiId(bankStr);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile info", error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (paymentMethod === "BANK") {
            if (formData.bank_account.length < 6 || formData.ifsc_code.length < 4 || formData.bank_name.length < 2) {
                setError("Please fill all bank fields accurately.");
                return;
            }
        } else {
            if (upiId.length < 3) {
                setError("Please enter a valid UPI ID.");
                return;
            }
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");
            const payment_method_string = paymentMethod === "UPI"
                ? upiId
                : `Bank AC: ${formData.bank_account}, IFSC: ${formData.ifsc_code}, Name: ${formData.bank_name}`;

            const res = await fetch(`${API_URL}/api/users/bank-details`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ payment_method_string }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to update bank details");
                return;
            }

            setSuccess("Bank details updated successfully! These will be used for your future refunds.");
        } catch (error) {
            setError("Cannot connect to server to update details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payment Information</h1>
                <p className="text-gray-500">Manage the bank account where you will receive your product refunds.</p>
            </div>

            <Card className="bg-white border-0 shadow-sm ring-1 ring-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                    <CardTitle className="text-lg text-gray-900">Bank Details</CardTitle>
                    <CardDescription>
                        This information is encrypted securely and used exclusively by admins to process your cashback.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {isFetching ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                        </div>
                    ) : (
                        <form id="payment-form" onSubmit={handleSave} className="space-y-5">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 font-medium">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-100 font-medium">
                                    {success}
                                </div>
                            )}

                            <div className="space-y-4">
                                <Label className="text-gray-700 font-medium">Payment Method <span className="text-red-500">*</span></Label>
                                <div className="flex gap-6 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" className="w-4 h-4 text-blue-600" checked={paymentMethod === "UPI"} onChange={() => setPaymentMethod("UPI")} />
                                        <span className="text-sm">UPI</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" className="w-4 h-4 text-blue-600" checked={paymentMethod === "BANK"} onChange={() => setPaymentMethod("BANK")} />
                                        <span className="text-sm">Bank Account</span>
                                    </label>
                                </div>

                                {paymentMethod === "UPI" ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="upi_id" className="text-gray-700 font-medium">UPI ID</Label>
                                        <Input
                                            id="upi_id"
                                            placeholder="yourname@upi"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                            className="h-11 bg-white border-gray-200"
                                            required={paymentMethod === "UPI"}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4 pt-2 border-t border-gray-100">
                                        <div className="space-y-2">
                                            <Label htmlFor="bank_account" className="text-gray-700 font-medium">Account Number</Label>
                                            <Input
                                                id="bank_account"
                                                placeholder="1234567890"
                                                value={formData.bank_account}
                                                onChange={handleChange}
                                                className="h-11 bg-white border-gray-200"
                                                required={paymentMethod === "BANK"}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="ifsc_code" className="text-gray-700 font-medium">IFSC Code</Label>
                                                <Input
                                                    id="ifsc_code"
                                                    placeholder="SBIN0001234"
                                                    value={formData.ifsc_code}
                                                    onChange={handleChange}
                                                    className="h-11 bg-white border-gray-200 uppercase"
                                                    required={paymentMethod === "BANK"}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bank_name" className="text-gray-700 font-medium">Account / Bank Name</Label>
                                                <Input
                                                    id="bank_name"
                                                    placeholder="State Bank of India"
                                                    value={formData.bank_name}
                                                    onChange={handleChange}
                                                    className="h-11 bg-white border-gray-200"
                                                    required={paymentMethod === "BANK"}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <Button
                        type="submit"
                        form="payment-form"
                        disabled={isLoading || isFetching || (paymentMethod === "BANK" ? (!formData.bank_account || !formData.ifsc_code || !formData.bank_name) : !upiId)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                        {isLoading ? "Saving..." : "Save Payment Details"}
                    </Button>
                </CardFooter>
            </Card>
        </div >
    );
}

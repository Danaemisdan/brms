"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiImageDropzone } from "@/components/ui/multi-image-dropzone";
import { toast } from "sonner";

const API_URL = "";

export default function CustomerPaymentInfo() {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [upiId, setUpiId] = useState("");
    const [qrCodeUrl, setQrCodeUrl] = useState("");
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
            const res = await apiFetch(`${API_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                if (json.user && json.user.encrypted_bank_data) {
                    const bankStr = json.user.encrypted_bank_data;

                    // Parse Bank Details
                    const acMatch = bankStr.match(/Bank AC:\s*([^,]+)/);
                    const ifscMatch = bankStr.match(/IFSC:\s*([^,]+)/);
                    const nameMatch = bankStr.match(/Name:\s*([^,]+)/);

                    if (acMatch || ifscMatch || nameMatch) {
                        setFormData({
                            bank_account: acMatch ? acMatch[1].trim() : "",
                            ifsc_code: ifscMatch ? ifscMatch[1].trim() : "",
                            bank_name: nameMatch ? nameMatch[1].trim() : ""
                        });
                    }

                    // Parse UPI details
                    const upiMatch = bankStr.match(/UPI:\s*([^,]+)/);
                    if (upiMatch) {
                        setUpiId(upiMatch[1].trim());
                    } else if (!acMatch && !bankStr.includes("QR:") && !bankStr.includes("UPI:")) {
                        // Legacy fallback for simple UPI string
                        setUpiId(bankStr);
                    }

                    // Parse QR
                    const qrMatch = bankStr.match(/QR:\s*(.+)/);
                    if (qrMatch) {
                        setQrCodeUrl(qrMatch[1].trim());
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

    const handleFileUpload = async (files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];

        const uploadToast = toast.loading("Uploading QR code...");
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('file', file);

            const uploadRes = await apiFetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            if (!uploadRes.ok) throw new Error('Failed to upload image');

            const uploadData = await uploadRes.json();
            setQrCodeUrl(uploadData.fileUrl);
            toast.success("QR Code uploaded seamlessly", { id: uploadToast });
        } catch (error) {
            toast.error("File upload failed. Please try again.", { id: uploadToast });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const hasBank = formData.bank_account.length >= 6 && formData.ifsc_code.length >= 4 && formData.bank_name.length >= 2;
        const hasUpi = upiId.length >= 3;
        const hasQr = qrCodeUrl.length > 5;

        if (!hasBank && !hasUpi && !hasQr) {
            setError("Please provide at least one complete payment method (Bank details, UPI ID, or QR Code).");
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");

            // Build unified string
            let parts = [];
            if (hasBank) {
                parts.push(`Bank AC: ${formData.bank_account}, IFSC: ${formData.ifsc_code}, Name: ${formData.bank_name}`);
            }
            if (hasUpi) {
                parts.push(`UPI: ${upiId}`);
            }
            if (hasQr) {
                parts.push(`QR: ${qrCodeUrl}`);
            }

            const payment_method_string = parts.join(" | ");

            const res = await apiFetch(`${API_URL}/api/users/bank-details`, {
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

            setSuccess("All Payment details successfully updated! These will be used for your next seamless refund.");
            toast.success("Payment preferences saved");
        } catch (err: any) {
            setError(err.message || "Cannot connect to server to update details.");
            toast.error(err.message || "Failed to update details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl border border-gray-100 rounded-lg p-6 bg-white shadow-sm">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payment Information</h1>
                <p className="text-gray-500 text-sm mt-1">Provide your preferred bank or UPI details for automated cashback processing.</p>
            </div>

            {isFetching ? (
                <div className="flex justify-center items-center h-40">
                    <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                </div>
            ) : (
                <form id="payment-form" onSubmit={handleSave} className="space-y-8">
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

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Bank Details Block */}
                        <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                            <h3 className="font-semibold text-gray-800 border-b pb-2">Direct Bank Transfer</h3>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="bank_account" className="text-gray-700 text-xs font-semibold uppercase tracking-wider">Account Number</Label>
                                    <Input
                                        id="bank_account"
                                        placeholder="1234567890"
                                        value={formData.bank_account}
                                        onChange={handleChange}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ifsc_code" className="text-gray-700 text-xs font-semibold uppercase tracking-wider">IFSC Code</Label>
                                    <Input
                                        id="ifsc_code"
                                        placeholder="SBIN0001234"
                                        value={formData.ifsc_code}
                                        onChange={handleChange}
                                        className="bg-white uppercase"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="bank_name" className="text-gray-700 text-xs font-semibold uppercase tracking-wider">Account Holder / Bank Name</Label>
                                    <Input
                                        id="bank_name"
                                        placeholder="State Bank of India"
                                        value={formData.bank_name}
                                        onChange={handleChange}
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* UPI & QR Block */}
                        <div className="space-y-6">
                            <div className="space-y-4 p-5 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                <h3 className="font-semibold text-blue-900 border-b border-blue-100 pb-2">UPI Instant Transfer</h3>
                                <div className="space-y-1.5">
                                    <Label htmlFor="upi_id" className="text-gray-700 text-xs font-semibold uppercase tracking-wider">UPI ID / VPA</Label>
                                    <Input
                                        id="upi_id"
                                        placeholder="yourname@upi"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        className="bg-white border-blue-200 focus-visible:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">UPI QR Code</h3>
                                {qrCodeUrl ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <img src={qrCodeUrl.startsWith('http') ? qrCodeUrl : `${API_URL}${qrCodeUrl}`} alt="Saved QR Code" className="w-32 h-32 object-contain rounded-xl border border-gray-200 bg-white p-2 shadow-sm" />
                                        <Button variant="outline" size="sm" type="button" onClick={() => setQrCodeUrl("")} className="text-red-500 border-red-100 hover:bg-red-50">Remove QR Code</Button>
                                    </div>
                                ) : (
                                    <MultiImageDropzone
                                        maxFiles={1}
                                        onFilesAdded={handleFileUpload}
                                        disabled={isLoading}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        <Button
                            type="submit"
                            form="payment-form"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-foreground shadow-sm px-8"
                        >
                            {isLoading ? "Saving details..." : "Save All Payment Details"}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

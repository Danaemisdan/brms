import React, { useCallback, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
    value: string;
    onChange: (fileBase64: string) => void;
    disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const processFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            onChange(result);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
        // Reset input value so the same file can be selected again if removed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
    };

    return (
        <div
            className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                : isDragging ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                    : "border-gray-200 bg-white hover:border-blue-400 hover:bg-gray-50 cursor-pointer"
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={disabled}
            />
            {value ? (
                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img src={value} alt="Upload preview" className="object-contain h-full w-full" />
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm shadow-sm"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-3 text-center py-4">
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                        <UploadCloud className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">
                            Click to upload <span className="text-gray-500 font-normal">or drag and drop</span>
                        </p>
                        <p className="text-xs text-gray-500">
                            JPEG, PNG or WebP (max. 5MB)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

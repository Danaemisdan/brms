import React, { useCallback, useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface MultiImageDropzoneProps {
    onFilesAdded: (files: File[]) => void;
    disabled?: boolean;
    maxFiles?: number;
    currentCount?: number;
}

export function MultiImageDropzone({ onFilesAdded, disabled, maxFiles = 6, currentCount = 0 }: MultiImageDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const remainingSlots = Math.max(0, maxFiles - currentCount);
    const isAtLimit = remainingSlots <= 0;

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isAtLimit) setIsDragging(true);
    }, [disabled, isAtLimit]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const processFiles = (fileList: FileList | File[]) => {
        if (disabled || isAtLimit) return;

        const validFiles = Array.from(fileList).filter(file => file.type.startsWith("image/"));

        if (validFiles.length !== fileList.length) {
            toast.error("Some files were skipped because they are not image files.");
        }

        if (validFiles.length > remainingSlots) {
            toast.warning(`Only ${remainingSlots} slots remaining. Some files were skipped.`);
        }

        const filesToKeep = validFiles.slice(0, remainingSlots);
        if (filesToKeep.length > 0) {
            onFilesAdded(filesToKeep);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            processFiles(e.dataTransfer.files);
        }
    }, [disabled, isAtLimit, remainingSlots]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
            // Reset input so the same files can be selected again
            e.target.value = "";
        }
    }, [disabled, isAtLimit, remainingSlots]);

    return (
        <div
            className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all ${disabled || isAtLimit ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                    : isDragging ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                        : "border-gray-200 bg-white hover:border-blue-400 hover:bg-gray-50 cursor-pointer"
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && !isAtLimit && document.getElementById("multi-file-upload")?.click()}
        >
            <input
                id="multi-file-upload"
                type="file"
                multiple
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={disabled || isAtLimit}
            />
            {isAtLimit ? (
                <div className="text-center">
                    <p className="text-sm font-semibold text-gray-500">Maximum limit reached</p>
                    <p className="text-xs text-gray-400">You can't upload more than {maxFiles} images total.</p>
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
                            You can add up to {remainingSlots} more {remainingSlots === 1 ? 'image' : 'images'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

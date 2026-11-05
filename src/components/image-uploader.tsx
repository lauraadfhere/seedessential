"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { cn } from "./ui";
import { authHeaders } from "@/lib/api-client";

interface ImageUploaderProps {
  label?: string;
  value?: string; // Cloudinary URL
  onChange: (url: string, publicId: string) => void;
  folder?: "profiles" | "products" | "guides" | "experts" | "projects";
  required?: boolean;
  className?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export function ImageUploader({
  label = "Upload Image",
  value,
  onChange,
  folder = "profiles",
  required = false,
  className,
  maxSizeMB = 5,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError(`Please upload a valid image file (${acceptedTypes.join(", ")})`);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    try {
      // Step 1: Get signature from our API
      const signResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ folder }),
      });

      if (!signResponse.ok) {
        const errorData = await signResponse.json();
        throw new Error(errorData.error || "Failed to get upload signature");
      }

      const { signature, timestamp, apiKey, cloudName, folder: cloudinaryFolder } = await signResponse.json();

      // Step 2: Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", cloudinaryFolder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const uploadData = await uploadResponse.json();
      
      // Call onChange with the secure URL and public ID
      onChange(uploadData.secure_url, uploadData.public_id);
      setPreview(uploadData.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    setError(null);
    onChange("", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-semibold text-neutral-800">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="space-y-3">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="h-48 w-48 rounded-md object-cover border-2 border-neutral-200"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center shadow-md"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes.join(",")}
              onChange={handleFileSelect}
              disabled={uploading}
              required={required && !preview}
              className="hidden"
              id={`file-upload-${folder}`}
            />
            <label
              htmlFor={`file-upload-${folder}`}
              className={cn(
                "flex flex-col items-center justify-center h-48 w-48 border-2 border-dashed border-neutral-300 rounded-md cursor-pointer hover:border-[#40533d] transition-colors bg-neutral-50",
                uploading && "opacity-50 cursor-not-allowed"
              )}
            >
              {uploading ? (
                <>
                  <svg className="h-8 w-8 animate-spin text-[#40533d]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="mt-2 text-sm text-neutral-600">Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="mt-2 text-sm font-medium text-neutral-600">Upload Photo</span>
                  <span className="mt-1 text-xs text-neutral-500">Max {maxSizeMB}MB</span>
                </>
              )}
            </label>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}

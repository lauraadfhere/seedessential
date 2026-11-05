"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { cn } from "./ui";
import { authHeaders } from "@/lib/api-client";

interface UploadedDocument {
  name: string;
  url: string;
  publicId: string;
  type: string;
  size: number;
}

interface DocumentUploaderProps {
  label?: string;
  description?: string;
  value: UploadedDocument[];
  onChange: (documents: UploadedDocument[]) => void;
  folder?: "profiles" | "products" | "guides" | "experts" | "projects" | "businessDocuments" | "claims";
  required?: boolean;
  className?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function DocumentUploader({
  label = "Upload Documents",
  description = "Upload certificates, licenses, or professional documents",
  value = [],
  onChange,
  folder = "experts",
  required = false,
  className,
  maxSizeMB = 10,
  maxFiles = 5,
  acceptedTypes = ["application/pdf", "image/jpeg", "image/png"],
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (value.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} documents`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadedDocs: UploadedDocument[] = [];

      for (const file of files) {
        // Validate file type
        if (!acceptedTypes.includes(file.type)) {
          setError(`${file.name}: Invalid file type. Accepted: PDF, JPG, PNG`);
          continue;
        }

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
          setError(`${file.name}: File size must be less than ${maxSizeMB}MB`);
          continue;
        }

        // Get signature from our API
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

        // Upload to Cloudinary
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
          throw new Error(`Failed to upload ${file.name}`);
        }

        const uploadData = await uploadResponse.json();
        
        uploadedDocs.push({
          name: file.name,
          url: uploadData.secure_url,
          publicId: uploadData.public_id,
          type: file.type,
          size: file.size,
        });
      }

      onChange([...value, ...uploadedDocs]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemove(publicId: string) {
    onChange(value.filter((doc) => doc.publicId !== publicId));
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }

  function getFileIcon(type: string) {
    if (type === "application/pdf") {
      return (
        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
          <path d="M14 2v6h6M10 13h4M10 17h4M10 9h1"/>
        </svg>
      );
    }
    return (
      <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
        <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>
      </svg>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <label className="text-sm font-semibold text-neutral-800">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && (
          <p className="mt-1 text-xs text-neutral-600">{description}</p>
        )}
      </div>

      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          disabled={uploading || value.length >= maxFiles}
          multiple
          required={required && value.length === 0}
          className="hidden"
          id={`doc-upload-${folder}`}
        />
        <label
          htmlFor={`doc-upload-${folder}`}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-neutral-300 rounded-md cursor-pointer hover:border-[#40533d] transition-colors bg-white text-sm font-medium text-neutral-700",
            (uploading || value.length >= maxFiles) && "opacity-50 cursor-not-allowed"
          )}
        >
          {uploading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Document ({value.length}/{maxFiles})
            </>
          )}
        </label>
      </div>

      {/* Uploaded Documents List */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((doc) => (
            <div
              key={doc.publicId}
              className="flex items-center gap-3 p-3 border border-neutral-200 rounded-md bg-white"
            >
              <div className="flex-shrink-0">
                {getFileIcon(doc.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{doc.name}</p>
                {doc.size !== undefined && <p className="text-xs text-neutral-500">{formatFileSize(doc.size)}</p>}
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#40533d] hover:underline"
              >
                View
              </a>
              <button
                type="button"
                onClick={() => handleRemove(doc.publicId)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}

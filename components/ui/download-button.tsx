"use client";

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  fileUrl: string;
  fileName: string;
  fileType?: string;
  className?: string;
  variant?: "default" | "secondary" | "outline";
  size?: "sm" | "default" | "lg";
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  fileUrl, 
  fileName, 
  fileType = "document",
  className = "",
  variant = "default",
  size = "default"
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!fileUrl) return;
    setIsDownloading(true);

    try {
      // Force Cloudinary to treat as attachment
      // Replaces '/upload/' with '/upload/fl_attachment/'
      const downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');

      // Programmatically trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Clean filename and add extension
      const safeName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      // Map file type to extension
      const extensionMap: Record<string, string> = {
        'pdf': 'pdf',
        'document': 'docx',
        'docx': 'docx',
        'video': 'mp4',
        'mp4': 'mp4',
        'audio': 'mp3',
        'mp3': 'mp3',
        'image': 'jpg',
        'jpg': 'jpg',
        'jpeg': 'jpg',
        'png': 'png',
        'powerpoint': 'pptx',
        'pptx': 'pptx',
        'excel': 'xlsx',
        'xlsx': 'xlsx',
        'text': 'txt',
        'txt': 'txt'
      };
      
      const cleanFileType = fileType.toLowerCase().trim();
      const extension = extensionMap[cleanFileType] || 'pdf';
      
      link.download = `${safeName}.${extension}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Variant styles
  const variantStyles = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white/90 text-gray-800 hover:bg-white",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  };

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading || !fileUrl}
      className={cn(
        "flex items-center gap-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      <Download 
        size={size === "sm" ? 16 : size === "lg" ? 20 : 18} 
        className={isDownloading ? "animate-bounce" : ""} 
      />
      {isDownloading ? "Downloading..." : "Download"}
    </button>
  );
};

export default DownloadButton;

"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChartDisplayProps {
  src: string;
  alt?: string;
  title?: string;
  chartId?: string;
}

export function ChartDisplay({ src, alt = "Chart", title, chartId }: ChartDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = title ? `${title}.png` : "chart.png";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <>
      <div className="relative group rounded-lg overflow-hidden border bg-white dark:bg-zinc-800 max-w-md">
        {/* Chart Image */}
        <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-900">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
        </div>

        {/* Title */}
        {title && (
          <div className="px-3 py-2 border-t">
            <p className="text-sm font-medium truncate">{title}</p>
          </div>
        )}

        {/* Overlay buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 dark:bg-zinc-800/90"
            onClick={() => setIsOpen(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 dark:bg-zinc-800/90"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{title || "Chart"}</DialogTitle>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-zinc-800/90"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-900">
              <Image
                src={src}
                alt={alt}
                fill
                className="object-contain"
              />
            </div>
            <div className="p-4 border-t flex justify-between items-center">
              <span className="font-medium">{title || "Chart"}</span>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

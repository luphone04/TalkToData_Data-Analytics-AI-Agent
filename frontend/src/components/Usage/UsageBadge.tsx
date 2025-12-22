"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Upload } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UsageData {
  message_count: number;
  upload_count: number;
  message_limit: number;
  upload_limit: number;
}

interface UsageBadgeProps {
  refreshTrigger?: number;
}

export function UsageBadge({ refreshTrigger = 0 }: UsageBadgeProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetchUsage();
  }, [refreshTrigger]);

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/usage");
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    }
  };

  const data = usage || {
    message_count: 0,
    upload_count: 0,
    message_limit: 50,
    upload_limit: 10,
  };

  const getColor = (count: number, limit: number) => {
    const percentage = (count / limit) * 100;
    if (percentage >= 90) return "text-red-600 dark:text-red-400";
    if (percentage >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-zinc-600 dark:text-zinc-400";
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1.5 ${getColor(data.message_count, data.message_limit)}`}>
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="font-medium">{data.message_count}/{data.message_limit}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Messages used today</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600" />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1.5 ${getColor(data.upload_count, data.upload_limit)}`}>
              <Upload className="h-3.5 w-3.5" />
              <span className="font-medium">{data.upload_count}/{data.upload_limit}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>File uploads today</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

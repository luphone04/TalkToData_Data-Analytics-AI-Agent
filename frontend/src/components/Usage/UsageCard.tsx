"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Upload, Zap } from "lucide-react";

interface UsageData {
  message_count: number;
  upload_count: number;
  tokens_used: number;
  message_limit: number;
  upload_limit: number;
  remaining_messages: number;
  remaining_uploads: number;
}

interface UsageCardProps {
  refreshTrigger?: number;
}

export function UsageCard({ refreshTrigger = 0 }: UsageCardProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Daily Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default values if API fails
  const data = usage || {
    message_count: 0,
    upload_count: 0,
    tokens_used: 0,
    message_limit: 50,
    upload_limit: 10,
    remaining_messages: 50,
    remaining_uploads: 10,
  };

  const messagePercentage = (data.message_count / data.message_limit) * 100;
  const uploadPercentage = (data.upload_count / data.upload_limit) * 100;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Daily Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <MessageSquare className="h-3.5 w-3.5" />
              Messages
            </div>
            <span className="font-medium">
              {data.message_count} / {data.message_limit}
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full transition-all ${getProgressColor(messagePercentage)}`}
              style={{ width: `${Math.min(messagePercentage, 100)}%` }}
            />
          </div>
          {data.remaining_messages <= 10 && data.remaining_messages > 0 && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              {data.remaining_messages} messages remaining today
            </p>
          )}
          {data.remaining_messages === 0 && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Daily limit reached. Resets at midnight UTC.
            </p>
          )}
        </div>

        {/* Uploads */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Upload className="h-3.5 w-3.5" />
              File Uploads
            </div>
            <span className="font-medium">
              {data.upload_count} / {data.upload_limit}
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full transition-all ${getProgressColor(uploadPercentage)}`}
              style={{ width: `${Math.min(uploadPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Free tier note */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          Free tier: {data.message_limit} messages & {data.upload_limit} uploads per day
        </p>
      </CardContent>
    </Card>
  );
}

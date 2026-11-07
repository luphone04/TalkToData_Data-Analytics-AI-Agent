"use client";

import { cn } from "@/lib/utils";
import { User, Bot, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChartGallery, Chart } from "@/components/Charts";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  charts?: string[];
  chartErrors?: string[];
}

export function MessageBubble({ role, content, timestamp, charts, chartErrors }: MessageBubbleProps) {
  const isUser = role === "user";

  // Convert chart URLs to Chart objects
  const chartObjects: Chart[] = (charts || []).map((url, index) => ({
    id: `chart-${index}`,
    url,
    title: `Chart ${index + 1}`,
  }));

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%] overflow-hidden",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="space-y-2">
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isUser
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words overflow-hidden">{content}</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:bg-zinc-200 dark:prose-pre:bg-zinc-900 prose-code:text-blue-600 dark:prose-code:text-blue-400">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Filter out images with empty src to avoid console errors
                  img: ({ src, alt, ...props }) => {
                    if (!src) return null;
                    return <img src={src} alt={alt || ""} {...props} />;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
          {timestamp && (
            <div
              className={cn(
                "text-xs mt-1",
                isUser ? "text-blue-200" : "text-zinc-500"
              )}
            >
              {timestamp}
            </div>
          )}
        </div>

        {/* Display charts if any */}
        {chartObjects.length > 0 && (
          <ChartGallery charts={chartObjects} />
        )}

        {/* Charts that were generated but could not be delivered */}
        {chartErrors && chartErrors.length > 0 && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">
                Analysis completed, but {chartErrors.length} chart
                {chartErrors.length > 1 ? "s" : ""} could not be delivered.
              </p>
              <ul className="mt-1 list-disc pl-4">
                {Array.from(new Set(chartErrors)).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

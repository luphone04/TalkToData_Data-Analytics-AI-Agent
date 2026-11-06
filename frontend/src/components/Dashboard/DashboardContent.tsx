"use client";

import { useState } from "react";
import { FilesPanel, UserFile } from "@/components/FileUpload";
import { ChatContainer } from "@/components/Chat";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, MessageSquare } from "lucide-react";

interface DashboardContentProps {
  onUsageChange?: () => void;
}

type MobileTab = "chat" | "files";

/**
 * One FilesPanel and one ChatContainer stay mounted at all screen sizes, in the
 * same place in the tree. On small screens a tab bar only toggles visibility,
 * so resizing or switching tabs keeps the active conversation and its state.
 */
export function DashboardContent({ onUsageChange }: DashboardContentProps) {
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  const handleFileSelect = (file: UserFile) => {
    setSelectedFile(file);
  };

  const handleUsageChange = () => {
    onUsageChange?.();
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-4 lg:grid lg:grid-cols-4 lg:gap-6">
      {/* Mobile only: tab bar */}
      <Tabs
        value={mobileTab}
        onValueChange={(value) => setMobileTab(value as MobileTab)}
        className="lg:hidden shrink-0"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Files
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Files panel - narrower column on desktop, "Files" tab on mobile */}
      <div
        className={cn(
          "lg:col-span-1 flex-col gap-4 min-h-0",
          mobileTab === "files" ? "flex flex-1" : "hidden lg:flex"
        )}
      >
        <div className="flex-1 overflow-auto">
          <FilesPanel onFileSelect={handleFileSelect} onFileUploaded={handleUsageChange} />
        </div>
        {selectedFile && (
          <div className="shrink-0 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Selected:</strong> {selectedFile.original_name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              This file will be used in your next message
            </p>
          </div>
        )}
      </div>

      {/* Chat panel - wider column on desktop, "Chat" tab on mobile */}
      <div
        className={cn(
          "lg:col-span-3 min-h-0 lg:block",
          mobileTab === "chat" ? "flex-1" : "hidden"
        )}
      >
        <ChatContainer selectedFileId={selectedFile?.id} onMessageSent={handleUsageChange} />
      </div>
    </div>
  );
}

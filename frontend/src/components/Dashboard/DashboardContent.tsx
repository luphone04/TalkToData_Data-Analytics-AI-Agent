"use client";

import { useState } from "react";
import { FilesPanel, UserFile } from "@/components/FileUpload";
import { ChatContainer } from "@/components/Chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, MessageSquare } from "lucide-react";

interface DashboardContentProps {
  onUsageChange?: () => void;
}

export function DashboardContent({ onUsageChange }: DashboardContentProps) {
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);

  const handleFileSelect = (file: UserFile) => {
    setSelectedFile(file);
  };

  const handleUsageChange = () => {
    onUsageChange?.();
  };

  return (
    <div className="h-[calc(100vh-5rem)]">
      {/* Mobile: Tabs layout */}
      <div className="lg:hidden h-full">
        <Tabs defaultValue="chat" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Files
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 mt-4 min-h-0">
            <ChatContainer selectedFileId={selectedFile?.id} onMessageSent={handleUsageChange} />
          </TabsContent>
          <TabsContent value="files" className="flex-1 mt-4 overflow-auto">
            <FilesPanel onFileSelect={handleFileSelect} onFileUploaded={handleUsageChange} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: Side by side layout */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6 h-full">
        {/* Files Panel - narrower */}
        <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
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

        {/* Chat Panel - wider */}
        <div className="lg:col-span-3 min-h-0">
          <ChatContainer selectedFileId={selectedFile?.id} onMessageSent={handleUsageChange} />
        </div>
      </div>
    </div>
  );
}

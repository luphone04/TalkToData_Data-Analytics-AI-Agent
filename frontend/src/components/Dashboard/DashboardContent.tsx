"use client";

import { useState } from "react";
import { FilesPanel, UserFile } from "@/components/FileUpload";
import { ChatContainer } from "@/components/Chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, MessageSquare } from "lucide-react";

export function DashboardContent() {
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);

  const handleFileSelect = (file: UserFile) => {
    setSelectedFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Mobile: Tabs layout */}
      <div className="lg:hidden">
        <Tabs defaultValue="chat" className="w-full">
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
          <TabsContent value="chat" className="mt-4">
            <ChatContainer selectedFileId={selectedFile?.id} />
          </TabsContent>
          <TabsContent value="files" className="mt-4">
            <FilesPanel onFileSelect={handleFileSelect} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: Side by side layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {/* Files Panel - narrower */}
        <div className="lg:col-span-1">
          <FilesPanel onFileSelect={handleFileSelect} />
          {selectedFile && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
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
        <div className="lg:col-span-2">
          <ChatContainer selectedFileId={selectedFile?.id} />
        </div>
      </div>
    </div>
  );
}

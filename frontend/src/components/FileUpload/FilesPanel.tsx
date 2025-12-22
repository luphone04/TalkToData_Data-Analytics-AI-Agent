"use client";

import { FileUploader, FileList, UserFile } from "@/components/FileUpload";
import { useFiles } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";

interface FilesPanelProps {
  onFileSelect?: (file: UserFile) => void;
}

export function FilesPanel({ onFileSelect }: FilesPanelProps) {
  const { files, isLoading, deleteFile, addFile } = useFiles();

  const handleUploadComplete = (file: { id: string; filename: string; originalName: string; size: number; mimeType: string }) => {
    // Convert to UserFile format
    const userFile: UserFile = {
      id: file.id,
      filename: file.filename,
      original_name: file.originalName,
      file_size: file.size,
      mime_type: file.mimeType,
      created_at: new Date().toISOString(),
    };
    addFile(userFile);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Your Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUploader onUploadComplete={handleUploadComplete} />
        <FileList
          files={files}
          isLoading={isLoading}
          onDelete={deleteFile}
          onSelect={onFileSelect}
        />
      </CardContent>
    </Card>
  );
}

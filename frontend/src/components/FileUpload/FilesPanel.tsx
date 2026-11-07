"use client";

import { FileUploader, FileList, UserFile } from "@/components/FileUpload";
import { useFiles } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";

interface FilesPanelProps {
  selectedFileId?: string;
  onFileSelect?: (file: UserFile) => void;
  onFileUploaded?: () => void;
  onFileDeleted?: (fileId: string) => void;
}

export function FilesPanel({ selectedFileId, onFileSelect, onFileUploaded, onFileDeleted }: FilesPanelProps) {
  const { files, isLoading, deleteFile, addFile } = useFiles();

  const handleDelete = async (fileId: string) => {
    await deleteFile(fileId); // throws if the delete failed
    onFileDeleted?.(fileId);
  };

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
    // Trigger usage refresh after upload
    onFileUploaded?.();
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
          selectedId={selectedFileId}
          onDelete={handleDelete}
          onSelect={onFileSelect}
        />
      </CardContent>
    </Card>
  );
}

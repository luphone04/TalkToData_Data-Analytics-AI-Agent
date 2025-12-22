"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { UserFile } from "@/components/FileUpload";

export function useFiles() {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/files");

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch files";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File deleted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete file";
      setError(message);
      toast.error(message);
      throw err;
    }
  }, []);

  const addFile = useCallback((file: UserFile) => {
    setFiles((prev) => [file, ...prev]);
  }, []);

  return {
    files,
    isLoading,
    error,
    fetchFiles,
    deleteFile,
    addFile,
  };
}

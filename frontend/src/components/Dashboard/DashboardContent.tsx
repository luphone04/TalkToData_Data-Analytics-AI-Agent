"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilesPanel, UserFile } from "@/components/FileUpload";
import { ChatContainer } from "@/components/Chat";
import { useSupabase } from "@/hooks";
import {
  DATASET_UNAVAILABLE_NOTICE,
  DatasetSelection,
  restoreConversationDataset,
} from "@/lib/conversationDataset";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, MessageSquare } from "lucide-react";

interface DashboardContentProps {
  onUsageChange?: () => void;
}

type MobileTab = "chat" | "files";

// Selection made while no conversation is open (carried into the next one opened)
const NO_CONVERSATION = "__none__";

/**
 * One FilesPanel and one ChatContainer stay mounted at all screen sizes, in the
 * same place in the tree. On small screens a tab bar only toggles visibility,
 * so resizing or switching tabs keeps the active conversation and its state.
 *
 * The selected dataset is kept per conversation. Opening a conversation for
 * the first time restores the file it last used (if it still exists); a file
 * the user picks always wins over a restore that finishes later.
 */
export function DashboardContent({ onUsageChange }: DashboardContentProps) {
  const supabase = useSupabase();
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, DatasetSelection>>({});

  const selectionsRef = useRef(selections);
  useEffect(() => {
    selectionsRef.current = selections;
  }, [selections]);

  const selectionKey = activeConversationId ?? NO_CONVERSATION;
  const current: DatasetSelection = selections[selectionKey] ?? { file: null };
  const selectedFile = current.file as UserFile | null;

  // Restore the dataset last used in a conversation when it is first opened
  useEffect(() => {
    const id = activeConversationId;
    if (!id || id in selectionsRef.current) return;

    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const restored = await restoreConversationDataset(supabase, id, user.id);
      if (cancelled) return;
      // Keep a selection the user made while this was loading
      setSelections((prev) => (id in prev ? prev : { ...prev, [id]: restored }));
    })();

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, supabase]);

  const activeIdRef = useRef<string | null>(null);
  const handleActiveConversationChange = useCallback((id: string | null) => {
    const previous = activeIdRef.current;
    activeIdRef.current = id;
    // A file picked before any conversation was open goes to the first one opened
    if (id && previous === null) {
      setSelections((prev) => {
        const pending = prev[NO_CONVERSATION];
        if (!pending?.file || id in prev) return prev;
        const rest = { ...prev };
        delete rest[NO_CONVERSATION];
        return { ...rest, [id]: pending };
      });
    }
    setActiveConversationId(id);
  }, []);

  const handleFileSelect = (file: UserFile) => {
    setSelections((prev) => ({ ...prev, [selectionKey]: { file } }));
  };

  const handleFileDeleted = (fileId: string) => {
    setSelections((prev) => {
      const next: Record<string, DatasetSelection> = {};
      for (const [key, value] of Object.entries(prev)) {
        next[key] =
          value.file?.id === fileId ? { file: null, notice: DATASET_UNAVAILABLE_NOTICE } : value;
      }
      return next;
    });
  };

  const handleUsageChange = () => {
    onUsageChange?.();
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-4 lg:grid lg:grid-cols-4 lg:gap-6">
      {/* Mobile only: switches which panel is visible (plain buttons: no generated ids,
          so server and client HTML always match) */}
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="lg:hidden shrink-0 grid w-full grid-cols-2 h-9 items-center rounded-lg bg-muted p-[3px] text-muted-foreground"
      >
        {(
          [
            ["chat", "Chat", MessageSquare],
            ["files", "Files", FileSpreadsheet],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mobileTab === value}
            onClick={() => setMobileTab(value)}
            className={cn(
              "inline-flex h-[calc(100%-1px)] items-center justify-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm font-medium text-foreground transition-[color,box-shadow] focus-visible:outline-2 focus-visible:outline-ring",
              mobileTab === value && "bg-background shadow-sm dark:border-input dark:bg-input/30"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Files panel - narrower column on desktop, "Files" tab on mobile */}
      <div
        className={cn(
          "lg:col-span-1 flex-col gap-4 min-h-0",
          mobileTab === "files" ? "flex flex-1" : "hidden lg:flex"
        )}
      >
        <div className="flex-1 overflow-auto">
          <FilesPanel
            selectedFileId={selectedFile?.id}
            onFileSelect={handleFileSelect}
            onFileUploaded={handleUsageChange}
            onFileDeleted={handleFileDeleted}
          />
        </div>
        {selectedFile && (
          <div className="shrink-0 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Selected:</strong> {selectedFile.original_name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Used for messages in this conversation
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
        <ChatContainer
          selectedFileId={selectedFile?.id}
          selectedFileName={selectedFile?.original_name}
          datasetNotice={current.notice}
          onActiveConversationChange={handleActiveConversationChange}
          onMessageSent={handleUsageChange}
        />
      </div>
    </div>
  );
}

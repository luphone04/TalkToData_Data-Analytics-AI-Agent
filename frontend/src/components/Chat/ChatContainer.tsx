"use client";

import { useState, useEffect, useCallback } from "react";
import { ConversationList, Conversation } from "./ConversationList";
import { MessageList, Message } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useConversations, useMessages } from "@/hooks";
import { Menu, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatContainerProps {
  selectedFileId?: string;
}

export function ChatContainer({ selectedFileId }: ChatContainerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default on mobile
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  const {
    conversations,
    isLoading: conversationsLoading,
    createConversation,
    deleteConversation,
  } = useConversations();

  const {
    messages,
    isLoading: messagesLoading,
    isSending,
    sendMessage,
  } = useMessages(activeConversation?.id);

  // Auto-select first conversation or create new one
  useEffect(() => {
    if (!conversationsLoading && conversations.length > 0 && !activeConversation) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, conversationsLoading, activeConversation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K - New conversation
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleCreateConversation();
        toast.info("New conversation created", { duration: 2000 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateConversation = async () => {
    const newConversation = await createConversation();
    if (newConversation) {
      setActiveConversation(newConversation);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (activeConversation?.id === id) {
      setActiveConversation(conversations.find((c) => c.id !== id) || null);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) {
      // Create a new conversation first
      const newConversation = await createConversation(content.slice(0, 50));
      if (newConversation) {
        setActiveConversation(newConversation);
        await sendMessage(content, newConversation.id, selectedFileId);
      }
    } else {
      await sendMessage(content, activeConversation.id, selectedFileId);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="relative flex h-[600px] border rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden absolute inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 lg:hidden z-10"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar - overlay on mobile, side-by-side on desktop */}
      <div
        className={`
          absolute lg:relative z-30 lg:z-auto h-full
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          lg:w-64
        `}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConversation?.id}
          onSelect={handleSelectConversation}
          onCreate={handleCreateConversation}
          onDelete={handleDeleteConversation}
          isLoading={conversationsLoading}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {activeConversation ? (
          <>
            {/* Desktop: Full title bar */}
            <div className="hidden md:block shrink-0 border-b px-4 py-3 overflow-hidden">
              <h2 className="font-semibold truncate w-full">{activeConversation.title}</h2>
            </div>
            {/* Mobile: Compact popover */}
            <div className="md:hidden shrink-0 border-b px-2 py-2 flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 max-w-full overflow-hidden">
                    <Info className="h-4 w-4 shrink-0" />
                    <span className="truncate text-sm font-medium">{activeConversation.title}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="start">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Conversation</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 break-words">
                      {activeConversation.title}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <MessageList
              messages={messages}
              isLoading={messagesLoading}
              isTyping={isSending}
            />
            <ChatInput onSend={handleSendMessage} isLoading={isSending} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <p className="mb-4">No conversation selected</p>
            <Button onClick={handleCreateConversation}>Start New Chat</Button>
          </div>
        )}
      </div>
    </div>
  );
}

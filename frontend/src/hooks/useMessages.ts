"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Message } from "@/components/Chat/MessageList";
import { useSupabase } from "./useSupabase";

export function useMessages(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch messages";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = useCallback(
    async (content: string, convId?: string, fileId?: string): Promise<boolean> => {
      const targetConversationId = convId || conversationId;
      if (!targetConversationId) {
        setError("No conversation selected");
        return false;
      }

      try {
        setIsSending(true);
        setError(null);

        // Add user message to database
        const { data: userMessage, error: userMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: targetConversationId,
            role: "user",
            content,
            metadata: fileId ? { file_id: fileId } : {},
          })
          .select()
          .single();

        if (userMsgError) throw userMsgError;

        // Update local state with user message
        setMessages((prev) => [...prev, userMessage]);

        // Call backend API for agent response
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            conversation_id: targetConversationId,
            file_id: fileId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response");
        }

        const data = await response.json();

        // Add assistant message to database
        const { data: assistantMessage, error: assistantMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: targetConversationId,
            role: "assistant",
            content: data.response,
            metadata: data.charts ? { charts: data.charts } : {},
          })
          .select()
          .single();

        if (assistantMsgError) throw assistantMsgError;

        // Update local state with assistant message
        setMessages((prev) => [...prev, assistantMessage]);

        // Update conversation title if it's the first message
        if (messages.length === 0) {
          await supabase
            .from("conversations")
            .update({
              title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
              updated_at: new Date().toISOString(),
            })
            .eq("id", targetConversationId);
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send message";
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [supabase, conversationId, messages.length]
  );

  return {
    messages,
    isLoading,
    isSending,
    error,
    fetchMessages,
    sendMessage,
  };
}

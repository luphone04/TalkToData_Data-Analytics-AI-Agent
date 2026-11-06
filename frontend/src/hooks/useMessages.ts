"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Message } from "@/components/Chat/MessageList";
import { appendIfActive, mergeFetched } from "@/lib/messageState";
import { useSupabase } from "./useSupabase";

export function useMessages(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Conversations with a request in flight (the user may switch away mid-send)
  const [sendingFor, setSendingFor] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();

  // The conversation currently on screen; read after awaits to drop stale results.
  // Declared before the fetch effect so it is updated first.
  const activeIdRef = useRef(conversationId);
  useEffect(() => {
    activeIdRef.current = conversationId;
  }, [conversationId]);

  const fetchMessages = useCallback(async () => {
    const id = conversationId;
    if (!id) {
      setMessages([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });

      // The user switched conversations while this was loading
      if (activeIdRef.current !== id) return;

      if (fetchError) throw fetchError;
      setMessages((prev) => mergeFetched(prev, (data as Message[]) || [], id));
    } catch (err) {
      if (activeIdRef.current !== id) return;
      const message = err instanceof Error ? err.message : "Failed to fetch messages";
      setError(message);
      toast.error(message);
    } finally {
      if (activeIdRef.current === id) setIsLoading(false);
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
      // A brand-new conversation is selected and sent to in the same tick, before
      // this hook re-renders with it; treat it as the active one right away.
      if (!conversationId && convId) {
        activeIdRef.current = convId;
      }

      try {
        setSendingFor((prev) => [...prev, targetConversationId]);
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

        // Show it only if that conversation is still on screen
        setMessages((prev) => appendIfActive(prev, userMessage as Message, activeIdRef.current));

        // Call backend API for agent response
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            conversation_id: targetConversationId,
            message_id: userMessage.id,
            file_id: fileId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get response");
        }

        const data = await response.json();

        // The analysis did not run (e.g. the selected file failed to load or the
        // daily limit was reached): tell the user, don't save it as a reply.
        if (data.error) {
          toast.error(data.response || "The request could not be completed.");
          return false;
        }

        const chartErrors: string[] = data.chart_errors || [];

        if (chartErrors.length > 0) {
          toast.warning(
            `Analysis finished, but ${chartErrors.length} chart${chartErrors.length > 1 ? "s" : ""} could not be delivered.`
          );
        }

        // Add assistant message to database
        const { data: assistantMessage, error: assistantMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: targetConversationId,
            role: "assistant",
            content: data.response,
            metadata: {
              ...(data.charts ? { charts: data.charts } : {}),
              ...(chartErrors.length > 0 ? { chart_errors: chartErrors } : {}),
            },
          })
          .select()
          .single();

        if (assistantMsgError) throw assistantMsgError;

        // Show it only if that conversation is still on screen
        setMessages((prev) =>
          appendIfActive(prev, assistantMessage as Message, activeIdRef.current)
        );

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
        setSendingFor((prev) => {
          const i = prev.indexOf(targetConversationId);
          return i === -1 ? prev : [...prev.slice(0, i), ...prev.slice(i + 1)];
        });
      }
    },
    [supabase, conversationId, messages.length]
  );

  const isSending = conversationId ? sendingFor.includes(conversationId) : false;

  return {
    messages,
    isLoading,
    isSending,
    error,
    fetchMessages,
    sendMessage,
  };
}

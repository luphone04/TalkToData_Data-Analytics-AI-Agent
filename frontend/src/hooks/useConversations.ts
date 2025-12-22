"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Conversation } from "@/components/Chat/ConversationList";
import { useSupabase } from "./useSupabase";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (fetchError) throw fetchError;
      setConversations(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch conversations";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(
    async (title?: string): Promise<Conversation | null> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error: createError } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            title: title || "New Conversation",
          })
          .select()
          .single();

        if (createError) throw createError;

        setConversations((prev) => [data, ...prev]);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create conversation");
        return null;
      }
    },
    [supabase]
  );

  const deleteConversation = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from("conversations")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        setConversations((prev) => prev.filter((c) => c.id !== id));
        toast.success("Conversation deleted");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete conversation";
        setError(message);
        toast.error(message);
        return false;
      }
    },
    [supabase]
  );

  const updateConversationTitle = useCallback(
    async (id: string, title: string): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from("conversations")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (updateError) throw updateError;

        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title } : c))
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update conversation");
        return false;
      }
    },
    [supabase]
  );

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    createConversation,
    deleteConversation,
    updateConversationTitle,
  };
}

import type { SupabaseClient } from "@supabase/supabase-js";

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export type ConversationContext =
  | { ok: true; history: HistoryMessage[] }
  | { ok: false; status: number; error: string };

/**
 * Verify the conversation belongs to the user and load the messages that came
 * before the current one, oldest first.
 *
 * The current message is identified by its exact id (it was inserted just
 * before this request) and excluded by id, not by position.
 */
export async function loadConversationContext(
  supabase: SupabaseClient,
  {
    userId,
    conversationId,
    messageId,
    limit = 10,
  }: { userId: string; conversationId: string; messageId: string; limit?: number }
): Promise<ConversationContext> {
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (conversationError) {
    return { ok: false, status: 500, error: "Failed to load conversation" };
  }
  if (!conversation) {
    return { ok: false, status: 404, error: "Conversation not found" };
  }

  const { data: current, error: currentError } = await supabase
    .from("messages")
    .select("id, role, created_at")
    .eq("id", messageId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (currentError) {
    return { ok: false, status: 500, error: "Failed to load message" };
  }
  if (!current || current.role !== "user") {
    return { ok: false, status: 400, error: "Message not found in this conversation" };
  }

  const { data: rows, error: historyError } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .neq("id", messageId)
    .lte("created_at", current.created_at)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (historyError) {
    return { ok: false, status: 500, error: "Failed to load conversation history" };
  }

  const history = (rows ?? [])
    .filter(
      (row): row is { id: string; role: "user" | "assistant"; content: string; created_at: string } =>
        (row.role === "user" || row.role === "assistant") && typeof row.content === "string"
    )
    .reverse()
    .map(({ role, content }) => ({ role, content }));

  return { ok: true, history };
}

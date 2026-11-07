import type { SupabaseClient } from "@supabase/supabase-js";

export interface DatasetFile {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

/** Dataset selection for one conversation. `notice` explains why nothing is selected. */
export interface DatasetSelection {
  file: DatasetFile | null;
  notice?: string;
}

export const DATASET_UNAVAILABLE_NOTICE =
  "The dataset previously used in this conversation is no longer available. Select a dataset to continue.";

/**
 * Find the dataset most recently used in a conversation (the latest user
 * message with a saved file_id) and confirm the file still exists and belongs
 * to the signed-in user.
 */
export async function restoreConversationDataset(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<DatasetSelection> {
  const { data: rows, error } = await supabase
    .from("messages")
    .select("metadata, created_at")
    .eq("conversation_id", conversationId)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { file: null };
  }

  const fileId = (rows ?? [])
    .map((row) => (row.metadata as { file_id?: unknown } | null)?.file_id)
    .find((id): id is string => typeof id === "string" && id.length > 0);

  if (!fileId) {
    return { file: null };
  }

  const { data: file, error: fileError } = await supabase
    .from("user_files")
    .select("id, filename, original_name, file_size, mime_type, created_at")
    .eq("id", fileId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fileError || !file) {
    return { file: null, notice: DATASET_UNAVAILABLE_NOTICE };
  }

  return { file: file as DatasetFile };
}

// Pure helpers for keeping the visible message list consistent when the user
// switches conversations while requests are still in flight.

export interface StoredMessage {
  id: string;
  conversation_id?: string;
  created_at: string;
}

/** Append a saved message only if it belongs to the conversation on screen. */
export function appendIfActive<T extends StoredMessage>(
  prev: T[],
  message: T,
  activeConversationId: string | undefined
): T[] {
  if (!activeConversationId || message.conversation_id !== activeConversationId) {
    return prev;
  }
  if (prev.some((m) => m.id === message.id)) {
    return prev;
  }
  return [...prev, message];
}

/**
 * Replace the list with freshly fetched rows for `conversationId`, keeping any
 * messages of that conversation added locally while the fetch was in flight.
 * Messages from other conversations are dropped.
 */
export function mergeFetched<T extends StoredMessage>(
  prev: T[],
  fetched: T[],
  conversationId: string
): T[] {
  const fetchedIds = new Set(fetched.map((m) => m.id));
  const pendingLocal = prev.filter(
    (m) => m.conversation_id === conversationId && !fetchedIds.has(m.id)
  );
  return [...fetched, ...pendingLocal].sort((a, b) =>
    a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0
  );
}

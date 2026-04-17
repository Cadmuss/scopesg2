import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ChatFolder = {
  id: string;
  name: string;
  color: string;
};

export type ChatConversation = {
  id: string;
  title: string;
  folder_id: string | null;
  tags: string[];
  last_message_at: string;
  created_at: string;
};

export type StoredMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

export function useChatHistory() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setFolders([]);
      setConversations([]);
      return;
    }
    setLoading(true);
    const [{ data: f }, { data: c }] = await Promise.all([
      supabase.from("chat_folders").select("*").order("created_at", { ascending: true }),
      supabase.from("chat_conversations").select("*").order("last_message_at", { ascending: false }),
    ]);
    setFolders((f as ChatFolder[]) || []);
    setConversations((c as ChatConversation[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createConversation = useCallback(
    async (title = "New consultation", folder_id: string | null = null) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, title, folder_id })
        .select()
        .single();
      if (error) {
        toast.error("Couldn't create conversation");
        return null;
      }
      await refresh();
      return data as ChatConversation;
    },
    [user, refresh]
  );

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      const { error } = await supabase.from("chat_conversations").update({ title }).eq("id", id);
      if (error) return toast.error("Rename failed");
      await refresh();
    },
    [refresh]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("chat_conversations").delete().eq("id", id);
      if (error) return toast.error("Delete failed");
      await refresh();
    },
    [refresh]
  );

  const moveConversation = useCallback(
    async (id: string, folder_id: string | null) => {
      const { error } = await supabase.from("chat_conversations").update({ folder_id }).eq("id", id);
      if (error) return toast.error("Move failed");
      await refresh();
    },
    [refresh]
  );

  const setConversationTags = useCallback(
    async (id: string, tags: string[]) => {
      const { error } = await supabase.from("chat_conversations").update({ tags }).eq("id", id);
      if (error) return toast.error("Tag update failed");
      await refresh();
    },
    [refresh]
  );

  const createFolder = useCallback(
    async (name: string, color = "hsl(var(--accent))") => {
      if (!user || !name.trim()) return;
      const { error } = await supabase
        .from("chat_folders")
        .insert({ user_id: user.id, name: name.trim(), color });
      if (error) return toast.error("Folder failed");
      await refresh();
    },
    [user, refresh]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("chat_folders").delete().eq("id", id);
      if (error) return toast.error("Delete failed");
      await refresh();
    },
    [refresh]
  );

  const loadMessages = useCallback(async (conversationId: string): Promise<StoredMessage[]> => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, ordering")
      .eq("conversation_id", conversationId)
      .order("ordering", { ascending: true });
    if (error || !data) return [];
    return data
      .filter((m) => m.role !== "system")
      .map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }));
  }, []);

  const saveMessage = useCallback(
    async (conversationId: string, message: StoredMessage, ordering: number) => {
      if (!user) return;
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: message.role,
        content: message.content,
        ordering,
      });
      await supabase
        .from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    [user]
  );

  const updateLastAssistantMessage = useCallback(
    async (conversationId: string, content: string) => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, ordering")
        .eq("conversation_id", conversationId)
        .order("ordering", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.id) {
        await supabase.from("chat_messages").update({ content }).eq("id", data.id);
      }
    },
    []
  );

  return {
    folders,
    conversations,
    loading,
    refresh,
    createConversation,
    renameConversation,
    deleteConversation,
    moveConversation,
    setConversationTags,
    createFolder,
    deleteFolder,
    loadMessages,
    saveMessage,
    updateLastAssistantMessage,
  };
}

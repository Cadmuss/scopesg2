-- Folders
CREATE TABLE public.chat_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'hsl(var(--primary))',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own folders" ON public.chat_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own folders" ON public.chat_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own folders" ON public.chat_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own folders" ON public.chat_folders FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_chat_folders_updated BEFORE UPDATE ON public.chat_folders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conversations
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New consultation',
  folder_id UUID REFERENCES public.chat_folders(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own conversations" ON public.chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own conversations" ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations" ON public.chat_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own conversations" ON public.chat_conversations FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_chat_conversations_user ON public.chat_conversations(user_id, last_message_at DESC);
CREATE INDEX idx_chat_conversations_folder ON public.chat_conversations(folder_id);
CREATE TRIGGER trg_chat_conversations_updated BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  ordering INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_chat_messages_conv ON public.chat_messages(conversation_id, ordering ASC);
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  User,
  Briefcase,
  Users,
  Wallet,
  Award,
  FileText,
  Loader2,
  Sparkles,
  Target,
  ClipboardList,
  MapPin,
  Calculator,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ChatSidebar from "@/components/ChatSidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useChatHistory, StoredMessage } from "@/hooks/useChatHistory";

type Message = StoredMessage;

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sg-chat`;

const quickStarters = [
  { icon: Briefcase, text: "I want to start an F&B business in Singapore" },
  { icon: Users, text: "I'm planning to launch a fintech startup" },
  { icon: Wallet, text: "I want to open an e-commerce store targeting SEA" },
  { icon: Award, text: "I'm exploring the healthcare/wellness industry" },
];

const sgSuperpowers = [
  {
    icon: Target,
    label: "Match SG Grants",
    prompt: "Match me to relevant Singapore government grants based on what I've shared so far (EDG, PSG, MRA, Startup SG Founder, SFEC). Show eligibility, max funding, and apply links.",
  },
  {
    icon: ClipboardList,
    label: "Compliance Checklist",
    prompt: "Generate my personalised Singapore regulatory compliance checklist as a markdown table — every license, permit, and registration I need with agency, fee, processing time, and apply link.",
  },
  {
    icon: MapPin,
    label: "Location Heatmap",
    prompt: "Give me a Singapore location heatmap comparison table (3-5 planning areas) for my business — foot traffic, rent S$/sqft, demographics, competitor density, and best-fit recommendation.",
  },
  {
    icon: Calculator,
    label: "CPF + Hiring Cost",
    prompt: "Calculate my full Singapore hiring cost. Assume 2 local hires (one S$4,000/mo, one S$6,000/mo) — break down employer CPF, SDL, total monthly + annual cost. Include EP qualifying salary thresholds.",
  },
];

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: { role: string; content: string }[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    if (resp.status === 429) { onError("Rate limited — please wait a moment and try again."); return; }
    if (resp.status === 402) { onError("AI credits exhausted. Please try again later."); return; }
    if (resp.status === 401) {
      try {
        const j = await resp.json();
        onError(j?.message || "Please sign in to continue.");
      } catch { onError("Please sign in to continue."); }
      return;
    }
    if (resp.status === 400) {
      try { const j = await resp.json(); onError(j?.error || "Invalid request."); } catch { onError("Invalid request."); }
      return;
    }
    onError("Something went wrong. Please try again."); return;
  }
  if (!resp.body) { onError("No response body"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

const ANON_KEY = "sg_anon_chat_messages";
const FREE_LIMIT = 5;

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const history = useChatHistory();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [limitReached, setLimitReached] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const assistantRef = useRef("");
  const messageCountRef = useRef(0);
  const migrationRef = useRef(false);

  const SNAPSHOT_MARKER = "<!-- SNAPSHOT_READY -->";
  const snapshotDelivered = messages.some(
    (m) => m.role === "assistant" && m.content.includes(SNAPSHOT_MARKER)
  );
  const stripMarker = (s: string) => s.replace(SNAPSHOT_MARKER, "").trimEnd();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Hydrate anon chat from sessionStorage (auto-cleared when the tab/browser closes)
  useEffect(() => {
    if (user) return;
    try {
      const raw = sessionStorage.getItem(ANON_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed);
          const userTurns = parsed.filter((m) => m.role === "user").length;
          if (userTurns >= FREE_LIMIT) setLimitReached(true);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist anon messages to sessionStorage as they grow
  useEffect(() => {
    if (user) return;
    try {
      if (messages.length) sessionStorage.setItem(ANON_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, user]);

  // Load messages when active conversation changes (signed-in only)
  useEffect(() => {
    if (!user) return;
    if (!activeId) {
      setMessages([]);
      messageCountRef.current = 0;
      return;
    }
    history.loadMessages(activeId).then((m) => {
      setMessages(m);
      messageCountRef.current = m.length;
    });
  }, [activeId, history.loadMessages, user]);

  // Migrate anon chat into a real saved conversation once the user signs in
  useEffect(() => {
    if (!user || migrationRef.current) return;
    let raw: string | null = null;
    try { raw = sessionStorage.getItem(ANON_KEY); } catch {}
    if (!raw) return;
    let anon: Message[] = [];
    try { anon = JSON.parse(raw) as Message[]; } catch {}
    if (!Array.isArray(anon) || anon.length === 0) {
      try { sessionStorage.removeItem(ANON_KEY); } catch {}
      return;
    }
    migrationRef.current = true;
    (async () => {
      const firstUser = anon.find((m) => m.role === "user");
      const title = firstUser
        ? (firstUser.content.length > 60 ? firstUser.content.slice(0, 57) + "..." : firstUser.content)
        : "Previous consultation";
      const created = await history.createConversation(title);
      if (!created) { migrationRef.current = false; return; }
      let ordering = 0;
      for (const m of anon) {
        await history.saveMessage(created.id, m, ordering++);
      }
      try { sessionStorage.removeItem(ANON_KEY); } catch {}
      setActiveId(created.id);
      setMessages(anon);
      messageCountRef.current = anon.length;
      setLimitReached(false);
      toast.success("Your earlier chat has been saved to your account.");
    })();
  }, [user, history]);

  const handleNew = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    messageCountRef.current = 0;
    setLimitReached(false);
    if (!user) {
      try { sessionStorage.removeItem(ANON_KEY); } catch {}
    }
  }, [user]);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isLoading) return;

      const userTurnsSoFar = messages.filter((m) => m.role === "user").length;

      if (!user && userTurnsSoFar >= FREE_LIMIT) {
        setLimitReached(true);
        return;
      }

      // Ensure conversation exists (only for signed-in users — anon chats aren't persisted)
      let convId = activeId;
      if (user) {
        if (!convId) {
          const title = msg.length > 60 ? msg.slice(0, 57) + "..." : msg;
          const created = await history.createConversation(title);
          if (!created) return;
          convId = created.id;
          setActiveId(convId);
        }
      }

      const userMsg: Message = { role: "user", content: msg };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);
      assistantRef.current = "";

      // Persist user message (signed-in only)
      if (user && convId) {
        await history.saveMessage(convId, userMsg, messageCountRef.current);
        messageCountRef.current += 1;
        const assistantOrdering = messageCountRef.current;
        await history.saveMessage(convId, { role: "assistant", content: "" }, assistantOrdering);
        messageCountRef.current += 1;
      }

      const upsert = (chunk: string) => {
        assistantRef.current += chunk;
        const content = assistantRef.current;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      try {
        await streamChat({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          onDelta: upsert,
          onDone: async () => {
            setIsLoading(false);
            if (convId && assistantRef.current) {
              await history.updateLastAssistantMessage(convId, assistantRef.current);
            }
          },
          onError: (err) => {
            toast.error(err);
            setIsLoading(false);
          },
        });
      } catch {
        toast.error("Failed to connect. Please try again.");
        setIsLoading(false);
      }
    },
    [input, messages, isLoading, user, activeId, history, navigate]
  );

  // Auto-send initial prompt from navigation state (e.g. from News "Ask analyst")
  const initialSentRef = useRef(false);
  useEffect(() => {
    const initial = (location.state as { initialPrompt?: string } | null)?.initialPrompt;
    if (initial && !initialSentRef.current && user) {
      initialSentRef.current = true;
      // Clear nav state so reload doesn't re-fire
      navigate(location.pathname, { replace: true, state: null });
      handleNew();
      // Defer one tick so handleNew state resets first
      setTimeout(() => handleSend(initial), 0);
    }
  }, [location, user, handleSend, handleNew, navigate]);

  const handlePurchaseReport = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to purchase a report.");
      navigate("/auth");
      return;
    }
    setIsPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-report-checkout", {
        body: { consultationMessages: messages },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Failed to create checkout session");
    } finally {
      setIsPurchasing(false);
    }
  }, [user, messages, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 flex w-full">
        {/* Sidebar */}
        {user && sidebarOpen && (
          <ChatSidebar
            folders={history.folders}
            conversations={history.conversations}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={handleNew}
            onCreateFolder={history.createFolder}
            onDeleteFolder={history.deleteFolder}
            onDeleteConversation={async (id) => {
              await history.deleteConversation(id);
              if (id === activeId) handleNew();
            }}
            onRenameConversation={history.renameConversation}
            onMoveConversation={history.moveConversation}
            onSetTags={history.setConversationTags}
          />
        )}

        {/* Main chat */}
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full relative">
          {user && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="absolute left-2 top-2 z-10 p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          )}

          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 animate-float">
                  <Briefcase className="w-8 h-8 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  Your SG Business Consultant
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Singapore-only intelligence: live grant matching, regulatory checklists, location heatmaps, and CPF cost calcs — none of which generic AI can do for you.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full mb-6">
                  {quickStarters.map((q) => (
                    <button
                      key={q.text}
                      onClick={() => handleSend(q.text)}
                      className="p-4 rounded-xl border border-border bg-card text-left hover:border-accent/30 hover:shadow-[var(--shadow-card-hover)] transition-all group"
                    >
                      <q.icon className="w-5 h-5 text-accent mb-2" />
                      <p className="text-sm text-foreground leading-snug">{q.text}</p>
                    </button>
                  ))}
                </div>

                <div className="w-full max-w-2xl">
                  <div className="flex items-center gap-2 mb-3 justify-center">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      SG Superpowers — only here
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {sgSuperpowers.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => handleSend(s.prompt)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors"
                      >
                        <s.icon className="w-4 h-4 text-accent" />
                        <span className="text-xs font-medium text-foreground text-center leading-tight">
                          {s.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-accent" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "max-w-[75%] bg-navy text-primary-foreground rounded-br-md"
                        : "max-w-[92%] w-full bg-card border border-border text-foreground rounded-bl-md shadow-[var(--shadow-card)]"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="report-content text-[0.92rem]">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 className="font-display text-xl font-bold text-foreground mt-2 mb-3 pb-2 border-b border-border/60">{children}</h1>,
                            h2: ({ children }) => <h2 className="font-display text-lg font-bold text-foreground mt-5 mb-3">{children}</h2>,
                            h3: ({ children }) => <h3 className="font-display text-base font-semibold text-foreground mt-4 mb-2">{children}</h3>,
                            p: ({ children }) => <p className="my-2.5 leading-relaxed text-foreground">{children}</p>,
                            hr: () => <div className="my-5 border-t border-accent/20" />,
                            ul: ({ children }) => <ul className="my-2.5 space-y-1.5 list-disc pl-5">{children}</ul>,
                            ol: ({ children }) => <ol className="my-2.5 space-y-1.5 list-decimal pl-5">{children}</ol>,
                            li: ({ children }) => <li className="text-foreground leading-relaxed">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 underline underline-offset-2">{children}</a>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-accent/40 pl-4 my-3 italic text-muted-foreground bg-accent/5 py-2 pr-3 rounded-r-lg">{children}</blockquote>,
                            table: ({ children }) => (
                              <div className="my-4 overflow-x-auto rounded-lg border border-border/60">
                                <table className="w-full text-xs">{children}</table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-primary/5">{children}</thead>,
                            th: ({ children }) => <th className="px-3 py-2 text-left font-display font-semibold text-foreground text-[0.7rem] uppercase tracking-wider border-b border-border/60">{children}</th>,
                            td: ({ children }) => <td className="px-3 py-2 align-top text-foreground border-b border-border/30">{children}</td>,
                            code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs">{children}</code>,
                          }}
                        >
                          {stripMarker(msg.content)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* SG Superpowers quick-bar (when chat in progress) */}
          {messages.length > 0 && !isLoading && (
            <div className="px-4 py-2 border-t border-border bg-card/40 flex gap-2 overflow-x-auto">
              {sgSuperpowers.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSend(s.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-accent/10 hover:bg-accent/20 text-foreground border border-accent/20 whitespace-nowrap transition-colors shrink-0"
                >
                  <s.icon className="w-3 h-3 text-accent" />
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {snapshotDelivered && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 border-t border-accent/20 bg-accent/5"
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Get Your Premium Report</p>
                    <p className="text-xs text-muted-foreground">Detailed projections, competitor analysis &amp; 90-day launch plan</p>
                  </div>
                </div>
                <Button variant="gold" onClick={handlePurchaseReport} disabled={isPurchasing} className="gap-2 shrink-0">
                  {isPurchasing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <>SGD $20 — Buy Report</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {!user && limitReached && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 border-t border-accent/30 bg-accent/10"
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      You've used your {FREE_LIMIT} free messages
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Create a free account to keep chatting — your current conversation will be saved to your account. Close this tab without signing up and it will be cleared.
                    </p>
                  </div>
                </div>
                <Button variant="gold" onClick={() => navigate("/auth")} className="shrink-0">
                  Create free account
                </Button>
              </div>
            </motion.div>
          )}

          <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={
                  !user && limitReached
                    ? "Create a free account to keep chatting…"
                    : "Tell me about your business idea..."
                }
                disabled={!user && limitReached}
                className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <Button
                variant="gold"
                size="icon"
                className="h-12 w-12 rounded-xl shrink-0"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading || (!user && limitReached)}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {user
                ? "Chats auto-saved • Free viability snapshot • Premium PDF report: SGD $20"
                : `Free preview • ${Math.max(0, FREE_LIMIT - messages.filter((m) => m.role === "user").length)} of ${FREE_LIMIT} free messages left • Sign up to save your chat`}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Chat;

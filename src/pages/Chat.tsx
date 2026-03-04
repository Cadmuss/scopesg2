import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Briefcase, Users, Wallet, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sg-chat`;

const quickStarters = [
  { icon: Briefcase, text: "I want to start an F&B business in Singapore" },
  { icon: Users, text: "I'm planning to launch a fintech startup" },
  { icon: Wallet, text: "I want to open an e-commerce store targeting SEA" },
  { icon: Award, text: "I'm exploring the healthcare/wellness industry" },
];

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    if (resp.status === 429) { onError("Rate limited — please wait a moment and try again."); return; }
    if (resp.status === 402) { onError("AI credits exhausted. Please try again later."); return; }
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

const ConsultationSteps = () => (
  <div className="flex items-center gap-2 justify-center flex-wrap mb-6">
    {[
      { step: 1, label: "Business Idea", icon: Briefcase },
      { step: 2, label: "Demographics", icon: Users },
      { step: 3, label: "Budget", icon: Wallet },
      { step: 4, label: "Experience", icon: Award },
    ].map((s, i) => (
      <div key={s.step} className="flex items-center gap-2">
        {i > 0 && <div className="w-6 h-px bg-border hidden sm:block" />}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground">
          <s.icon className="w-3.5 h-3.5 text-accent" />
          <span>{s.label}</span>
        </div>
      </div>
    ))}
  </div>
);

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const assistantRef = useRef("");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    const userMsg: Message = { role: "user", content: msg };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    assistantRef.current = "";

    const upsert = (chunk: string) => {
      assistantRef.current += chunk;
      const content = assistantRef.current;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
        }
        return [...prev, { role: "assistant", content }];
      });
    };

    try {
      await streamChat({
        messages: updatedMessages,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (err) => { toast.error(err); setIsLoading(false); },
      });
    } catch {
      toast.error("Failed to connect. Please try again.");
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 animate-float">
                <Briefcase className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Your Business Consultant
              </h2>
              <p className="text-muted-foreground mb-4 max-w-md">
                I'll walk you through a quick consultation — just like speaking with a real advisor. Tell me your business idea and I'll assess its viability in Singapore.
              </p>
              <ConsultationSteps />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                {quickStarters.map((q) => (
                  <button
                    key={q.text}
                    onClick={() => handleSend(q.text)}
                    className="p-4 rounded-xl border border-border bg-card text-left hover:border-accent/30 hover:shadow-[var(--shadow-card-hover)] transition-all group"
                  >
                    <q.icon className="w-5 h-5 text-accent mb-2" />
                    <p className="text-sm text-foreground group-hover:text-foreground/90 leading-snug">{q.text}</p>
                  </button>
                ))}
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
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-navy text-primary-foreground rounded-br-md"
                      : "bg-card border border-border text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
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

        {/* Input */}
        <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Tell me about your business idea..."
              className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
            />
            <Button
              variant="gold"
              size="icon"
              className="h-12 w-12 rounded-xl shrink-0"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Free viability snapshot • Premium PDF report: SGD $20/report
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;

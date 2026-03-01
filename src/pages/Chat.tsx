import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Sparkles, TrendingUp, Shield, Landmark } from "lucide-react";
import Navbar from "@/components/Navbar";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const suggestedQueries = [
  { icon: TrendingUp, text: "What are the top growing sectors in Singapore for 2026?" },
  { icon: Shield, text: "What are the key risks for starting an F&B business in SG?" },
  { icon: Landmark, text: "What regulations should I know before launching a fintech startup?" },
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulated response for now — will connect to Lovable AI later
    setTimeout(() => {
      const responses: Record<string, string> = {
        default: `Great question! Here's a quick overview based on current Singapore market data:\n\n**Key Insights:**\n- Singapore's GDP growth is projected at 2.5-3.5% for 2026\n- The digital economy continues to be a major growth driver\n- Government initiatives like the SME Go Digital programme provide strong support\n\n**Recommendations:**\n1. Consider sectors aligned with Singapore's Green Plan 2030\n2. Leverage Enterprise Singapore grants for early-stage funding\n3. Monitor MAS guidelines if entering financial services\n\n*To get real-time, detailed analysis — upgrade to our Pro plan for unlimited queries.*`,
      };

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responses.default },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 animate-float">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                SG Pulse AI Analyst
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Ask anything about Singapore's market trends, regulations, risks, and business opportunities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full">
                {suggestedQueries.map((q) => (
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
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-2" : ""}>
                      {line.split(/(\*\*.*?\*\*)/).map((part, k) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <strong key={k} className="font-semibold">{part.slice(2, -2)}</strong>
                        ) : (
                          <span key={k}>{part}</span>
                        )
                      )}
                    </p>
                  ))}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
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
              placeholder="Ask about Singapore market trends, regulations, risks..."
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
            Free plan: 5 prompts/day • <span className="text-accent cursor-pointer hover:underline">Upgrade to Pro</span> for unlimited
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;

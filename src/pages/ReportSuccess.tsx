import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Download, CheckCircle, Loader2, ArrowLeft, List, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
// @ts-ignore - no types
import html2pdf from "html2pdf.js";

// Extract headings from markdown for table of contents
const extractHeadings = (markdown: string) => {
  const lines = markdown.split("\n");
  const headings: { level: number; text: string; id: string }[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/\*\*/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60);
      headings.push({ level, text, id });
    }
  }
  return headings;
};

const ReportSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToc, setShowToc] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  const headings = useMemo(() => (report ? extractHeadings(report) : []), [report]);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID found");
      setLoading(false);
      return;
    }

    const generateReport = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("generate-report", {
          body: { orderId },
        });
        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);
        setReport(data.report);
      } catch (e: any) {
        console.error("Report generation error:", e);
        setError(e.message || "Failed to generate report");
      } finally {
        setLoading(false);
      }
    };

    generateReport();
  }, [orderId]);

  const handleDownload = async () => {
    if (!report || !reportRef.current) return;
    toast.info("Preparing PDF...");
    try {
      const opt = {
        margin: [12, 12, 14, 12] as [number, number, number, number],
        filename: `ScopeSG-Business-Report-${orderId?.slice(0, 8)}.pdf`,
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy", "avoid-all"] },
      };
      await html2pdf().set(opt).from(reportRef.current).save();
      toast.success("PDF downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("PDF export failed. Try Print instead.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Custom heading renderer to add IDs for anchor linking
  const headingRenderer = (level: number) => {
    const Component = ({ children, ...props }: any) => {
      const text = typeof children === "string" ? children : 
        Array.isArray(children) ? children.map((c: any) => (typeof c === "string" ? c : c?.props?.children || "")).join("") : "";
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60);
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return <Tag id={id} className="scroll-mt-24" {...props}>{children}</Tag>;
    };
    return Component;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Generating Your Premium Report
              </h2>
              <p className="text-muted-foreground max-w-md">
                Our AI is analysing your business details and preparing a comprehensive viability report. This may take up to 30 seconds...
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Link to="/chat">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Chat
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Success header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Your Premium Report is Ready!
                  </h1>
                  <p className="text-sm text-muted-foreground">Payment confirmed • Report generated</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6 flex-wrap">
                <Button variant="gold" onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" /> Download Markdown
                </Button>
                <Button variant="outline" onClick={handlePrint} className="gap-2">
                  <FileText className="w-4 h-4" /> Print / Save as PDF
                </Button>
                <Button variant="outline" onClick={() => setShowToc(!showToc)} className="gap-2">
                  <List className="w-4 h-4" /> {showToc ? "Hide" : "Show"} Contents
                </Button>
                <Link to="/chat">
                  <Button variant="ghost" className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Chat
                  </Button>
                </Link>
              </div>

              <div className="flex gap-6 items-start">
                {/* Sticky Table of Contents sidebar */}
                {showToc && headings.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:block w-64 shrink-0 sticky top-24"
                  >
                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <List className="w-4 h-4 text-accent" /> Table of Contents
                        </h3>
                        <nav className="space-y-1">
                          {headings.map((h, i) => (
                            <button
                              key={i}
                              onClick={() => scrollToSection(h.id)}
                              className={`block w-full text-left text-xs transition-colors hover:text-accent truncate ${
                                h.level === 1
                                  ? "font-semibold text-foreground py-1.5"
                                  : h.level === 2
                                  ? "text-muted-foreground pl-3 py-1 border-l-2 border-border hover:border-accent"
                                  : "text-muted-foreground/70 pl-6 py-0.5 border-l-2 border-transparent"
                              }`}
                            >
                              {h.level > 1 && <ChevronRight className="w-3 h-3 inline mr-1 opacity-40" />}
                              {h.text}
                            </button>
                          ))}
                        </nav>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Report content */}
                <Card className="border-border/50 flex-1 min-w-0">
                  <CardContent className="p-6 md:p-10 lg:p-12" ref={reportRef}>
                    {/* Mobile TOC */}
                    {showToc && headings.length > 0 && (
                      <div className="lg:hidden mb-8 p-4 rounded-xl bg-muted/50 border border-border/50">
                        <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <List className="w-4 h-4 text-accent" /> Table of Contents
                        </h3>
                        <nav className="space-y-1">
                          {headings.map((h, i) => (
                            <button
                              key={i}
                              onClick={() => scrollToSection(h.id)}
                              className={`block w-full text-left text-xs transition-colors hover:text-accent truncate ${
                                h.level === 1
                                  ? "font-semibold text-foreground py-1"
                                  : "text-muted-foreground pl-3 py-0.5"
                              }`}
                            >
                              {h.text}
                            </button>
                          ))}
                        </nav>
                      </div>
                    )}

                    <div className="report-content">
                      <ReactMarkdown
                        components={{
                          h1: headingRenderer(1),
                          h2: headingRenderer(2),
                          h3: headingRenderer(3),
                          hr: () => <div className="my-8 border-t-2 border-accent/20" />,
                          table: ({ children }) => (
                            <div className="my-4 overflow-x-auto rounded-lg border border-border/60">
                              <table className="w-full text-sm">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-primary/5 dark:bg-primary/10">{children}</thead>
                          ),
                          th: ({ children }) => (
                            <th className="px-4 py-2.5 text-left font-display font-semibold text-foreground text-xs uppercase tracking-wider border-b border-border/60">{children}</th>
                          ),
                          td: ({ children }) => (
                            <td className="px-4 py-2.5 text-foreground border-b border-border/30">{children}</td>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-foreground">{children}</strong>
                          ),
                          a: ({ children, href }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 underline underline-offset-2">{children}</a>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-accent/40 pl-4 my-4 italic text-muted-foreground bg-accent/5 py-3 pr-4 rounded-r-lg">{children}</blockquote>
                          ),
                          ul: ({ children }) => (
                            <ul className="my-3 space-y-1.5 list-disc pl-5 text-foreground">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-3 space-y-1.5 list-decimal pl-5 text-foreground">{children}</ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-foreground leading-relaxed">{children}</li>
                          ),
                          p: ({ children }) => (
                            <p className="my-3 leading-relaxed text-foreground">{children}</p>
                          ),
                        }}
                      >
                        {report || ""}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportSuccess;

import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Download, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ReportSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

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

  const handleDownload = () => {
    if (!report) return;
    // Create a downloadable text/markdown file
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ScopeSG-Business-Report-${orderId?.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
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
                <Link to="/chat">
                  <Button variant="ghost" className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Chat
                  </Button>
                </Link>
              </div>

              {/* Report content */}
              <Card className="border-border/50">
                <CardContent className="p-6 md:p-10" ref={reportRef}>
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-table:text-foreground prose-th:text-foreground prose-td:text-foreground">
                    <ReactMarkdown>{report || ""}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportSuccess;

import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Download, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
// @ts-ignore - no types
import html2pdf from "html2pdf.js";

const ReportSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Auto-resize iframe to fit content
  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        const height = doc.documentElement.scrollHeight || doc.body.scrollHeight;
        iframe.style.height = `${height}px`;
      }
    } catch (e) {
      console.error("Failed to resize iframe:", e);
    }
  };

  const handleDownload = async () => {
    if (!report) return;
    toast.info("Preparing PDF...");
    try {
      const container = document.createElement("div");
      container.innerHTML = report;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "900px";
      document.body.appendChild(container);
  
      const opt: any = {
        margin: [0, 0, 0, 0],
        filename: `ScopeSG-Business-Report-${orderId?.slice(0, 8)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: 900 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };
  
      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
      toast.success("PDF downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("PDF export failed. Try Print instead.");
    }
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    const win = iframe?.contentWindow;
    if (win) {
      win.focus();
      win.print();
    } else {
      window.print();
    }
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
                  <Download className="w-4 h-4" /> Download PDF
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

              {/* Report content rendered in iframe (report is a full HTML document) */}
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <iframe
                    ref={iframeRef}
                    title="Premium Business Report"
                    srcDoc={report || ""}
                    onLoad={handleIframeLoad}
                    sandbox="allow-same-origin"
                    style={{
                      width: "100%",
                      minHeight: "800px",
                      border: "none",
                      display: "block",
                    }}
                  />
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

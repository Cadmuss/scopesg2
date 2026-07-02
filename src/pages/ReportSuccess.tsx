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
import ReportTopUp from "@/components/ReportTopUp";

const ReportSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [report, setReport] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<{ business_name: string } | null>(null);
  const [liveReportHtml, setLiveReportHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const displayHtml = liveReportHtml || report;

  useEffect(() => {
    if (!orderId) {
      setError("No order ID found");
      setLoading(false);
      return;
    }

    const loadReport = async () => {
      try {
        const { data: orderRow } = await supabase
          .from("report_orders")
          .select("report_content, status, consultation_data")
          .eq("id", orderId)
          .single();

        if (orderRow?.report_content) {
          setReport(orderRow.report_content);
          const convo = Array.isArray(orderRow.consultation_data)
            ? orderRow.consultation_data
            : JSON.parse(orderRow.consultation_data || "[]");
          const firstMsg = convo.find((m: any) => m.role === "user");
          setOrderData({ business_name: firstMsg?.content?.slice(0, 50) || "Your Business" });
          setLoading(false);
          return;
        }

        if (orderRow?.status === "paid" || orderRow?.status === "completed") {
       // Step 1: Get web search results
const firstUserMsg = orderRow.consultation_data
? (Array.isArray(orderRow.consultation_data) 
    ? orderRow.consultation_data 
    : JSON.parse(orderRow.consultation_data)
  ).find((m: any) => m.role === "user")
: null;

const businessContext = firstUserMsg?.content?.slice(0, 200) || "Singapore business";

const { data: searchData } = await supabase.functions.invoke("web-search", {
body: { businessContext },
});

const searchResults = searchData?.searchResults || "";

// Step 2: Generate report with search results
const { data, error: fnError } = await supabase.functions.invoke("generate-report", {
body: { orderId, searchResults },
});
          if (fnError) throw fnError;
          if (data?.error) throw new Error(data.error);
          if (data?.report) {
            setReport(data.report);
            setLoading(false);
          } else {
            pollForReport();
          }
        } else {
          setError("Order not found or not paid.");
          setLoading(false);
        }
      } catch (e: any) {
        console.error("Error:", e);
        setError(e.message || "Failed to load report");
        setLoading(false);
      }
    };

    const pollForReport = async () => {
      const maxAttempts = 60;
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const { data: orderRow } = await supabase
          .from("report_orders")
          .select("report_content, status")
          .eq("id", orderId)
          .single();

        if (orderRow?.report_content) {
          clearInterval(interval);
          setReport(orderRow.report_content);
          setLoading(false);
        } else if (orderRow?.status === "failed" || attempts >= maxAttempts) {
          clearInterval(interval);
          setError("Report is taking longer than expected. Please refresh the page.");
          setLoading(false);
        }
      }, 3000);
    };

    loadReport();
  }, [orderId]);

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
    if (!displayHtml) return;
    toast.info("Preparing PDF...");
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocked — please allow popups and try again.");
        return;
      }
      printWindow.document.write(displayHtml);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 800);
      };
      toast.success("Print dialog opened — choose 'Save as PDF'");
    } catch (e) {
      console.error(e);
      toast.error("Failed to open print dialog.");
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
                Our AI is analysing your business details and preparing a comprehensive viability report. This may take 2-3 minutes. Please don't close this tab...
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

              <div className="flex gap-3 mb-4 flex-wrap">
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

              {orderId && orderData && (
                <ReportTopUp
                  orderId={orderId}
                  businessName={orderData.business_name}
                  onReportUpdated={(html) => {
                    setLiveReportHtml(html);
                    toast.success("Report enhanced! Scroll down to see the updated version.");
                  }}
                />
              )}

              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <iframe
                    ref={iframeRef}
                    title="Premium Business Report"
                    srcDoc={displayHtml || ""}
                    onLoad={handleIframeLoad}
                    sandbox="allow-same-origin allow-scripts"
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
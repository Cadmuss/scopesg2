import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Loader as Loader2, ArrowLeft, Sparkles, Calendar, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type ReportOrder = {
  id: string;
  created_at: string;
  status: string;
  report_name: string | null;
};

const MyReports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("report_orders")
          .select("id, created_at, status, report_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders((data || []).filter((o) => o.status === "completed"));
      } catch (e: any) {
        console.error("Error fetching reports:", e);
        toast.error("Failed to load your reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, authLoading, navigate]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const startEditing = (order: ReportOrder) => {
    setEditingId(order.id);
    setDraftName(order.report_name || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftName("");
  };

  const saveName = async (orderId: string) => {
    const trimmed = draftName.trim().slice(0, 60);
    if (!trimmed) {
      cancelEditing();
      return;
    }

    const current = orders.find((o) => o.id === orderId);
    if (current && current.report_name === trimmed) {
      cancelEditing();
      return;
    }

    setSavingId(orderId);
    try {
      const { error } = await supabase
        .from("report_orders")
        .update({ report_name: trimmed })
        .eq("id", orderId);
      if (error) throw error;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, report_name: trimmed } : o))
      );
      toast.success("Report renamed.");
    } catch (e: any) {
      console.error("Failed to rename report:", e);
      toast.error("Failed to rename report.");
    } finally {
      setSavingId(null);
      setEditingId(null);
      setDraftName("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                My Reports
              </h1>
              <p className="text-sm text-muted-foreground">
                Your completed business viability reports
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
              <p className="text-muted-foreground">Loading your reports...</p>
            </div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[40vh] text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                No reports yet
              </h2>
              <p className="text-muted-foreground mb-4 max-w-md">
                Complete a consultation and generate a report to see it here.
              </p>
              <Link to="/chat">
                <Button variant="gold" className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Start a Consultation
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-border/50 hover:border-accent/40 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          {editingId === order.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                autoFocus
                                value={draftName}
                                onChange={(e) => setDraftName(e.target.value.slice(0, 60))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveName(order.id);
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                onBlur={() => saveName(order.id)}
                                disabled={savingId === order.id}
                                maxLength={60}
                                placeholder="Report name"
                                className="w-full bg-transparent border-b border-accent/50 text-sm font-medium text-foreground outline-none focus:border-accent pb-0.5 disabled:opacity-50"
                              />
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => saveName(order.id)}
                                disabled={savingId === order.id}
                                className="text-accent hover:text-accent/80 flex-shrink-0 disabled:opacity-50"
                                aria-label="Save name"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={cancelEditing}
                                disabled={savingId === order.id}
                                className="text-muted-foreground hover:text-foreground flex-shrink-0 disabled:opacity-50"
                                aria-label="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 group">
                              {order.report_name ? (
                                <button
                                  type="button"
                                  onClick={() => startEditing(order)}
                                  className="text-sm font-medium text-foreground hover:text-accent transition-colors text-left truncate underline decoration-muted-foreground/40 decoration-dotted underline-offset-2 hover:decoration-accent"
                                  title="Click to rename"
                                >
                                  {order.report_name}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditing(order)}
                                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors underline decoration-muted-foreground/40 decoration-dotted underline-offset-2 hover:decoration-accent"
                                  title="Add a name"
                                >
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(order.created_at)}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => startEditing(order)}
                                className="text-muted-foreground/60 hover:text-accent transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                aria-label="Rename report"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          {order.report_name && editingId !== order.id && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(order.created_at)}
                            </div>
                          )}
                        </div>
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 flex-shrink-0">
                          Completed
                        </span>
                      </div>
                      <Link to={`/report-success?order_id=${order.id}`}>
                        <Button variant="gold" className="w-full gap-2">
                          <Sparkles className="w-4 h-4" /> View &amp; Enhance
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyReports;

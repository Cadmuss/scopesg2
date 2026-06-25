import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, AlertCircle, CheckCircle, Loader } from "lucide-react";

interface Props {
  orderId: string;
  businessName: string;
  onReportUpdated: (newHtml: string) => void;
}

export default function ReportTopUp({ orderId, businessName, onReportUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [supplement, setSupplement] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!supplement.trim() || supplement.trim().length < 20) {
      setStatus("error");
      setMessage("Please add at least 20 characters of additional information.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("regenerate-report", {
        body: { orderId, supplement: supplement.trim() },
      });

      if (error) throw error;

      if (data?.error) {
        setStatus("error");
        setMessage(data.error);
        return;
      }

      if (data?.report) {
        setStatus("success");
        setMessage("Report enhanced successfully!");
        onReportUpdated(data.report);
        setSupplement("");
        setTimeout(() => setOpen(false), 1500);
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="my-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
          style={{ background: "#c9a84c", color: "#0a1628" }}
        >
          <Sparkles size={16} />
          Enhance This Report (Free)
        </button>
      ) : (
        <div className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: "#c9a84c22", background: "#0a1628ee" }}>
          <div>
            <h3 className="font-semibold text-white mb-1">
              Add more info about <span style={{ color: "#c9a84c" }}>{businessName}</span>
            </h3>
            <p className="text-sm text-gray-400">
              Tell us anything we missed — extra services, locations, USPs, target customers.
              <strong className="text-yellow-400"> Note:</strong> This top-up is locked to your original business.
            </p>
          </div>

          <textarea
            value={supplement}
            onChange={(e) => setSupplement(e.target.value)}
            placeholder="e.g. We also run a loyalty card program, have 3 outlets in Tampines, Jurong and Orchard, and specialise in halal-certified products targeting Muslim families..."
            rows={5}
            className="w-full rounded-lg p-3 text-sm bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-yellow-500 resize-none"
          />

          {status === "error" && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-950 rounded-lg p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {message}
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-950 rounded-lg p-3">
              <CheckCircle size={16} />
              {message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={status === "loading"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-60"
              style={{ background: "#c9a84c", color: "#0a1628" }}
            >
              {status === "loading" ? (
                <><Loader size={16} className="animate-spin" /> Regenerating…</>
              ) : (
                <><Sparkles size={16} /> Generate Enhanced Report</>
              )}
            </button>
            <button
              onClick={() => { setOpen(false); setStatus("idle"); }}
              disabled={status === "loading"}
              className="px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TrendingUp, MailCheck, ArrowRight, Loader as Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

const EmailVerified = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "verified" | "error">("checking");

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(
      hash.startsWith("#") ? hash.slice(1) : hash
    );
    const type = params.get("type");

    if (type === "signup" || type === "email" || hash.includes("access_token")) {
      supabase.auth
        .getSession()
        .then(() => setStatus("verified"))
        .catch(() => setStatus("error"));
    } else if (type === "recovery") {
      navigate("/reset-password", { replace: true });
    } else {
      setStatus("verified");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {status === "checking" && (
            <div className="text-center text-primary-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-accent" />
              <p className="text-primary-foreground/60 text-sm">Verifying your email...</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center text-primary-foreground">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-red-400" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">Verification failed</h1>
              <p className="text-primary-foreground/60 text-sm mb-6">
                This link may be invalid or expired. Try signing in, or request a new confirmation email.
              </p>
              <Button variant="gold" onClick={() => navigate("/auth")}>
                Go to Sign In
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {status === "verified" && (
            <div className="bg-card rounded-2xl p-8 shadow-lg text-center">
              <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center mx-auto mb-5">
                <MailCheck className="w-7 h-7 text-accent" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Your email has been verified!
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                Please log in to continue using ScopeSG.
              </p>
              <Button
                variant="gold"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Go to Sign In
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EmailVerified;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowRight, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the magic link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setChecking(false);
      }
    });

    // Also check the URL hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
      setChecking(false);
    }

    // Give Supabase time to process the recovery token before showing expired
    const timeout = setTimeout(() => setChecking(false), 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "Your password has been reset successfully." });
      navigate("/chat");
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-hero)" }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 pt-16">
          <p className="text-primary-foreground/60 text-sm">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-hero)" }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 pt-16">
          <div className="text-center text-primary-foreground">
            <h1 className="font-display text-2xl font-bold mb-2">Invalid or expired link</h1>
            <p className="text-primary-foreground/60 text-sm mb-4">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Button variant="gold" onClick={() => navigate("/auth")}>
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-accent-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground">
              Set new password
            </h1>
            <p className="text-primary-foreground/60 mt-1 text-sm">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleReset} className="bg-card rounded-2xl p-6 shadow-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-foreground">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button variant="gold" className="w-full" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;

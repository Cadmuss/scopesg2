import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const features = [
  "Full AI analyst consultation",
  "Personalized market intelligence report",
  "Live web-search-backed data (trends, regulations, competitors)",
  "Enhance your report — currently included at no extra cost",
];

const faqs = [
  {
    q: "What's included in my S$20 report?",
    a: "A full AI-generated market intelligence report based on your consultation — covering relevant trends, regulations, funding/grants, and risks specific to your business idea.",
  },
  {
    q: "What does \"Enhance\" do?",
    a: "Enhance lets you deepen or refresh any section of your report after purchase — currently available to every report at no extra charge.",
  },
  {
    q: "Do I need a subscription?",
    a: "No — ScopeSG is pay-per-report. No recurring charges, no lock-in.",
  },
  {
    q: "Can I generate multiple reports?",
    a: "Yes, each report is a separate S$20 purchase — useful if you're evaluating multiple business ideas.",
  },
];

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-16">
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              One report. Everything you need to understand your Singapore market.
            </p>
          </motion.div>

          <motion.div
            className="max-w-md mx-auto relative p-8 rounded-2xl border bg-navy-deep text-primary-foreground border-accent/40"
            style={{ boxShadow: "var(--shadow-gold)" }}
            initial="hidden" animate="visible" custom={1} variants={fadeUp}
          >
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-5xl font-display font-bold">S$20</span>
            </div>
            <p className="text-sm text-primary-foreground/60 mb-6">per report</p>

            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link to="/chat">
              <Button variant="gold" className="w-full gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <p className="text-xs text-primary-foreground/50 mt-4 text-center">
              Enhance is currently included with every report. Pricing for individual features may evolve as ScopeSG grows.
            </p>
          </motion.div>

          <motion.div
            className="max-w-2xl mx-auto mt-24"
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
          >
            <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((item) => (
                <div key={item.q}>
                  <h3 className="font-display font-semibold text-foreground mb-1">{item.q}</h3>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
    <Footer />
  </div>
);

export default Pricing;
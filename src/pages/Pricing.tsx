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

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Get started and explore the platform",
    features: ["5 AI prompts per day", "1 marketplace post per week", "Basic market insights", "Community access"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$30",
    period: "/month",
    desc: "For serious entrepreneurs and SMEs",
    features: ["Unlimited AI prompts", "5 marketplace posts per week", "Advanced market analysis", "Regulation & policy alerts", "Priority support", "Export reports as PDF"],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    name: "Expert",
    price: "$100",
    period: "/month",
    desc: "Full-suite enterprise intelligence",
    features: ["Everything in Pro", "Custom research reports", "API access", "Dedicated account manager", "Early feature access", "White-label options"],
    cta: "Contact Us",
    highlighted: false,
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
              Choose Your Plan
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Start free and upgrade as your business grows. No hidden fees.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative p-8 rounded-2xl border transition-all ${
                  plan.highlighted
                    ? "bg-navy-deep text-primary-foreground border-accent/40"
                    : "bg-card text-foreground border-border"
                }`}
                style={{ boxShadow: plan.highlighted ? "var(--shadow-gold)" : "var(--shadow-card)" }}
                initial="hidden" animate="visible" custom={i + 1} variants={fadeUp}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-display font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/50" : "text-muted-foreground"}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 text-accent`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/chat">
                  <Button variant={plan.highlighted ? "gold" : "outline"} className="w-full gap-2">
                    {plan.cta} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
    <Footer />
  </div>
);

export default Pricing;

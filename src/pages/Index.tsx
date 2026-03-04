import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, BarChart3, Landmark, Users, Zap, ArrowRight, MessageSquare, Store } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }
  })
};

const features = [
{ icon: BarChart3, title: "Market Saturation Analysis", desc: "Understand competitive density across sectors in Singapore's economy." },
{ icon: Shield, title: "Risk Assessment", desc: "Identify financial, regulatory, and operational risks before they impact you." },
{ icon: Landmark, title: "Regulation Tracking", desc: "Stay ahead of MAS, ACRA, and government policy changes in real-time." },
{ icon: TrendingUp, title: "Trend Forecasting", desc: "AI-driven predictions on emerging market opportunities and shifts." },
{ icon: Users, title: "Marketplace & Funding", desc: "Connect with investors and advertise your venture to potential partners." },
{ icon: Zap, title: "Instant Insights", desc: "Get answers in seconds — no reports, no consultants, no waiting." }];




const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
                <Zap className="w-3.5 h-3.5" /> AI-Powered Market Intelligence for Singapore
              </span>
            </motion.div>
            <motion.h1
              className="text-4xl md:text-6xl font-display font-bold text-primary-foreground leading-tight mb-6"
              initial="hidden" animate="visible" custom={1} variants={fadeUp}>

              Navigate Singapore's Market{" "}
              <span className="text-accent">with Confidence</span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-primary-foreground/70 mb-8 max-w-2xl mx-auto"
              initial="hidden" animate="visible" custom={2} variants={fadeUp}>Get instant AI analysis on market trends, regulations, risks, and opportunities. Built for SMEs, entrepreneurs, and founders starting out in Singapore. 



            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial="hidden" animate="visible" custom={3} variants={fadeUp}>

              <Link to="/chat">
                <Button variant="hero" size="lg" className="gap-2">
                  <MessageSquare className="w-5 h-5" /> Ask the AI Analyst
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="hero-outline" size="lg" className="gap-2">
                  <Store className="w-5 h-5" /> Explore Marketplace
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
        {/* Bottom wave */}
        <div className="h-16 bg-background" style={{ clipPath: "ellipse(70% 100% at 50% 100%)" }} />
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Everything You Need to <span className="text-accent">Make Smart Moves</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">

            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) =>
            <motion.div
              key={f.title}
              className="group p-6 rounded-xl bg-card border border-border hover:border-accent/30 transition-all duration-300"
              style={{ boxShadow: "var(--shadow-card)" }}
              initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
              whileHover={{ y: -4, boxShadow: "var(--shadow-card-hover)" }}>

                <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>

            Ready to Make Data-Driven Decisions?
          </motion.h2>
          <motion.p
            className="text-primary-foreground/60 text-lg mb-8 max-w-xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>


          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp}>
            <Link to="/chat">
              <Button variant="hero" size="lg" className="gap-2">
                Get Started — It's Free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>);

};

export default Index;
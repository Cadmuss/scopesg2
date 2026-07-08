import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, BookOpen, MessageSquare, FileText, RefreshCw, FolderOpen, TrendingUp, Newspaper, CircleHelp as HelpCircle, Mail, CircleCheck as CheckCircle2, CreditCard, Download, Shield, Clock, Zap } from "lucide-react";

const SECTIONS = [
  { id: "getting-started", title: "Getting Started", icon: BookOpen },
  { id: "ai-analyst", title: "AI Analyst Chat", icon: MessageSquare },
  { id: "premium-report", title: "Premium Business Report", icon: FileText },
  { id: "enhance-report", title: "Enhance Your Report", icon: RefreshCw },
  { id: "my-reports", title: "My Reports", icon: FolderOpen },
  { id: "market-trends", title: "Market Trends", icon: TrendingUp },
  { id: "market-news", title: "Market News", icon: Newspaper },
  { id: "faq", title: "FAQ", icon: HelpCircle },
];

const Docs = () => {
  const [activeSection, setActiveSection] = useState("getting-started");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-border fixed left-0 top-0 h-screen bg-navy-deep/50">
          <div className="p-6">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 mb-6 text-primary-foreground/70 hover:text-primary-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-accent" />
              <span className="font-display font-semibold text-primary-foreground">Documentation</span>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-180px)]">
            <nav className="px-3 pb-6">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition ${
                    activeSection === section.id
                      ? "bg-accent/20 text-accent"
                      : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-navy-light/30"
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.title}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="container mx-auto px-4 py-16 max-w-4xl">
            {/* Mobile Back Button */}
            <div className="lg:hidden mb-6">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
            </div>

            {/* Header */}
            <div className="mb-12">
              <h1 className="font-display text-4xl font-bold text-primary-foreground mb-3">
                ScopeSG Documentation
              </h1>
              <p className="text-primary-foreground/70 text-lg">
                Everything you need to know about using ScopeSG for your Singapore business intelligence.
              </p>
            </div>

            {/* Getting Started */}
            <section id="getting-started" className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-primary-foreground">Getting Started</h2>
              </div>
              <div className="bg-navy-light/20 rounded-xl p-6 border border-navy-light/30">
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold">1</span>
                    <div>
                      <p className="text-primary-foreground/90">Create a free account at <Link to="/auth" className="text-accent hover:underline">ScopeSG</Link></p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold">2</span>
                    <div>
                      <p className="text-primary-foreground/90">Navigate to the <Link to="/chat" className="text-accent hover:underline">AI Analyst</Link> chat to begin your consultation</p>
                    </div>
                  </li>
                </ol>
              </div>
            </section>

            {/* AI Analyst Chat */}
            <section id="ai-analyst" className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-primary-foreground">AI Analyst Chat</h2>
              </div>
              <div className="bg-navy-light/20 rounded-xl p-6 border border-navy-light/30">
                <h3 className="font-semibold text-primary-foreground mb-3">How it works</h3>
                <p className="text-primary-foreground/80 mb-4">
                  The AI asks targeted questions about your business idea, budget, target market, and goals.
                </p>
                <div className="bg-navy-deep/50 rounded-lg p-4 mb-4">
                  <p className="text-primary-foreground/90">
                    <Zap className="w-4 h-4 inline mr-2 text-accent" />
                    Have a natural conversation — the more detail you provide, the better your report will be.
                  </p>
                </div>
                <p className="text-primary-foreground/80">
                  <strong className="text-accent">Minimum 4 messages required</strong> before purchasing a report.
                </p>
              </div>
            </section>

            {/* Premium Business Report */}
            <section id="premium-report" className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-primary-foreground">Premium Business Report</h2>
                <span className="ml-auto text-accent font-semibold">S$20</span>
              </div>
              <div className="bg-navy-light/20 rounded-xl p-6 border border-navy-light/30 space-y-6">
                {/* What's Included */}
                <div>
                  <h3 className="font-semibold text-primary-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    What's included
                  </h3>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {[
                      "Competitive landscape with real Singapore competitors and pricing",
                      "SWOT analysis",
                      "Market positioning recommendations",
                      "90-day KPI framework",
                      "Regulatory checklist",
                      "Strategic verdict",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-primary-foreground/80">
                        <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* How to Purchase */}
                <div className="border-t border-navy-light/30 pt-6">
                  <h3 className="font-semibold text-primary-foreground mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-accent" />
                    How to purchase
                  </h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3 text-primary-foreground/80">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">1</span>
                      <span>Complete at least 4 messages in the AI chat</span>
                    </li>
                    <li className="flex gap-3 text-primary-foreground/80">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">2</span>
                      <span>Click the <strong className="text-primary-foreground">'Generate Premium Report'</strong> button</span>
                    </li>
                    <li className="flex gap-3 text-primary-foreground/80">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">3</span>
                      <span>Complete payment via Stripe — Visa, Mastercard, PayNow accepted</span>
                    </li>
                    <li className="flex gap-3 text-primary-foreground/80">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">4</span>
                      <span>You are automatically redirected to your report page</span>
                    </li>
                  </ol>
                </div>

                {/* How to Download */}
                <div className="border-t border-navy-light/30 pt-6">
                  <h3 className="font-semibold text-primary-foreground mb-3 flex items-center gap-2">
                    <Download className="w-5 h-5 text-accent" />
                    How to download
                  </h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3 text-primary-foreground/80">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">1</span>
                      <span>On your report page, click <strong className="text-primary-foreground">'Download PDF'</strong></span>
                    </li>
                    <li className="flex gap-3 text-primary-foreground/80">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">2</span>
                      <span>A print dialog opens</span>
                    </li>
                    <li className="flex gap-3 text-primary-foreground/80">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">3</span>
                      <span>Select <strong className="text-primary-foreground">'Save as PDF'</strong> to save to your device</span>
                    </li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Enhance Your Report */}
            <section id="enhance-report" className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-primary-foreground">Enhance Your Report</h2>
                <span className="ml-auto text-emerald-400 text-sm font-medium px-2 py-1 bg-emerald-500/15 rounded-full">Free</span>
              </div>
              <div className="bg-navy-light/20 rounded-xl p-6 border border-navy-light/30">
                <p className="text-primary-foreground/80 mb-4">
                  After receiving your report, click <strong className="text-primary-foreground">'Enhance This Report'</strong> to add more business details and regenerate a more comprehensive version at no extra cost.
                </p>
                <h3 className="font-semibold text-primary-foreground mb-3">Steps</h3>
                <ol className="space-y-3">
                  <li className="flex gap-3 text-primary-foreground/80">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">1</span>
                    <span>Open your report from <Link to="/my-reports" className="text-accent hover:underline">My Reports</Link></span>
                  </li>
                  <li className="flex gap-3 text-primary-foreground/80">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">2</span>
                    <span>Click <strong className="text-primary-foreground">'Enhance This Report'</strong></span>
                  </li>
                  <li className="flex gap-3 text-primary-foreground/80">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">3</span>
                    <span>Type additional information about your business</span>
                  </li>
                  <li className="flex gap-3 text-primary-foreground/80">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">4</span>
                    <span>Click <strong className="text-primary-foreground">'Generate Enhanced Report'</strong> — takes 1-2 minutes</span>
                  </li>
                </ol>
              </div>
            </section>

            {/* My Reports */}
            <section id="my-reports" className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-primary-foreground">My Reports</h2>
              </div>
              <div className="bg-navy-light/20 rounded-xl p-6 border border-navy-light/30">
                <p className="text-primary-foreground/80">
                  Access all purchased reports anytime from the <strong className="text-primary-foreground">profile dropdown menu</strong> in the top navigation. Reports are saved permanently to your account.
                </p>
              </div>
            </section>

            {/* Market Trends */}
            <section id="market-trends" className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-primary-foreground">Market Trends</h2>
              </div>
              <div className="bg-navy-light/20 rounded-xl p-6 border border-navy-light/30">
                <p className="text-primary-foreground/80 mb-4">
                  AI-powered daily analysis of <strong className="text-primary-foreground">6 Singapore market trends</strong>, updated every 24 hours.
                </p>
                <h3 className="font-semibold text-primary-foreground mb-3">Each trend includes:</h3>
                <ul className="grid md:grid-cols-2 gap-3">
                  {[
                    "Growth opportunity",
                    "Threat analysis",
                    "Relevant government grants",
                    "Actionable advice",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-primary-foreground/80">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 bg-navy-deep/50 rounded-lg p-3">
                  <p className="text-primary-foreground/70 text-sm">
                    <Clock className="w-4 h-4 inline mr-2 text-accent" />
                    Data is cached — no wait time on repeat visits.
                  </p>
                </div>
              </div>
            </section>

            {/* Market News */}
            <section id="market-news" className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-primary-foreground">Market News</h2>
              </div>
              <div className="bg-navy-light/20 rounded-xl p-6 border border-navy-light/30">
                <p className="text-primary-foreground/80 mb-4">
                  Curated Singapore and global news with <strong className="text-primary-foreground">AI-predicted market impact</strong>.
                </p>
                <h3 className="font-semibold text-primary-foreground mb-3">Each item includes:</h3>
                <ul className="grid md:grid-cols-2 gap-3">
                  {[
                    "Severity rating",
                    "Affected sectors",
                    "Actionable advice",
                    "'Ask the Analyst' button",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-primary-foreground/80">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 bg-navy-deep/50 rounded-lg p-3">
                  <p className="text-primary-foreground/70 text-sm">
                    <MessageSquare className="w-4 h-4 inline mr-2 text-accent" />
                    Click 'Ask the Analyst' to continue the conversation in the AI chat.
                  </p>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-primary-foreground">FAQ</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-navy-light/20 rounded-xl p-6 border border-navy-light/30">
                  <h3 className="font-semibold text-primary-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent" />
                    Is my data secure?
                  </h3>
                  <p className="text-primary-foreground/80">
                    Yes — stored on Supabase with row-level security. Only you can access your reports and chat history.
                  </p>
                </div>

                <div className="bg-navy-light/20 rounded-xl p-6 border border-navy-light/30">
                  <h3 className="font-semibold text-primary-foreground mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-accent" />
                    Can I get a refund?
                  </h3>
                  <p className="text-primary-foreground/80">
                    Reports are <strong className="text-primary-foreground">non-refundable once generated</strong> as AI processing costs are incurred immediately.
                  </p>
                </div>

                <div className="bg-navy-light/20 rounded-xl p-6 border border-navy-light/30">
                  <h3 className="font-semibold text-primary-foreground mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    How accurate is the AI?
                  </h3>
                  <p className="text-primary-foreground/80">
                    Reports use <strong className="text-primary-foreground">Claude Sonnet</strong> with real-time web search for current Singapore market data. Always verify with a professional before making business decisions.
                  </p>
                </div>

                <div className="bg-navy-light/20 rounded-xl p-6 border border-navy-light/30">
                  <h3 className="font-semibold text-primary-foreground mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    How long does report generation take?
                  </h3>
                  <p className="text-primary-foreground/80">
                    Typically <strong className="text-primary-foreground">1-3 minutes</strong>. Do not close the tab while generating.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="mb-12">
              <div className="bg-accent/10 rounded-xl p-6 border border-accent/30">
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-primary-foreground">Contact Support</h3>
                </div>
                <p className="text-primary-foreground/80">
                  Need help? Email us at{" "}
                  <a href="mailto:itscadmus@gmail.com" className="text-accent hover:underline font-medium">
                    itscadmus@gmail.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Docs;

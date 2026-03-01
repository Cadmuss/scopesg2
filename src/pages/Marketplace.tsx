import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, MapPin, DollarSign, Tag, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const sampleListings = [
  {
    title: "Sustainable Packaging Startup — Seeking $200K Seed",
    category: "Green Tech",
    location: "Singapore Central",
    amount: "$200,000",
    posted: "2 days ago",
    desc: "Eco-friendly packaging solutions for F&B businesses. Patent pending. Looking for seed investors.",
  },
  {
    title: "AI-Powered Logistics Platform — Series A",
    category: "Logistics",
    location: "Jurong East",
    amount: "$1.5M",
    posted: "5 days ago",
    desc: "Optimizing last-mile delivery with machine learning. 3x growth in 12 months.",
  },
  {
    title: "Halal Food Cloud Kitchen — Franchise Partners Wanted",
    category: "F&B",
    location: "Geylang",
    amount: "$50,000",
    posted: "1 week ago",
    desc: "Award-winning halal food brand expanding via cloud kitchen model. Seeking franchise partners.",
  },
  {
    title: "EdTech Platform for SME Training",
    category: "Education",
    location: "One-North",
    amount: "$500,000",
    posted: "3 days ago",
    desc: "Government-approved SkillsFuture training platform for SME workforce upskilling.",
  },
  {
    title: "HealthTech Wearable — Pre-Series A",
    category: "HealthTech",
    location: "Biopolis",
    amount: "$800,000",
    posted: "1 day ago",
    desc: "Non-invasive glucose monitoring wearable. HSA clearance in progress.",
  },
  {
    title: "Co-Working Space — Investor Partnership",
    category: "Real Estate",
    location: "Tanjong Pagar",
    amount: "$300,000",
    posted: "4 days ago",
    desc: "Premium co-working targeting fintech startups. 85% occupancy rate.",
  },
];

const Marketplace = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-16">
      {/* Header */}
      <section className="py-12 md:py-16" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                Marketplace
              </h1>
              <p className="text-primary-foreground/60 text-lg">
                Discover investment opportunities and advertise your venture to Singapore's business community.
              </p>
            </div>
            <Button variant="gold" className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Create Listing
            </Button>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleListings.map((listing, i) => (
              <motion.div
                key={listing.title}
                className="group rounded-xl border border-border bg-card p-6 hover:border-accent/30 transition-all cursor-pointer"
                style={{ boxShadow: "var(--shadow-card)" }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: "var(--shadow-card-hover)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                    <Tag className="w-3 h-3" /> {listing.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {listing.posted}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                  {listing.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{listing.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.location}</span>
                    <span className="flex items-center gap-1 text-accent font-semibold"><DollarSign className="w-3 h-3" /> {listing.amount}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
    <Footer />
  </div>
);

export default Marketplace;

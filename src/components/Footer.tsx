import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-navy-deep text-primary-foreground/60 py-12 border-t border-navy-light/10">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-primary-foreground">ScopeSG</span>
          </div>
          <p className="text-sm">AI-powered market intelligence for Singapore's entrepreneurs and SMEs.</p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-primary-foreground mb-3">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/chat" className="hover:text-accent transition-colors">AI Analyst</Link></li>
            <li><Link to="/marketplace" className="hover:text-accent transition-colors">Marketplace</Link></li>
            <li><Link to="/pricing" className="hover:text-accent transition-colors">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-primary-foreground mb-3">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/docs" className="hover:text-accent transition-colors">Documentation</Link></li>
            <li><a href="mailto:itscadmus@gmail.com" className="hover:text-accent transition-colors">Support</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-primary-foreground mb-3">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-navy-light/10 text-sm text-center">
      © 2026 ScopeSG. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;

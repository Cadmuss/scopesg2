import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const links = [
    { to: "/", label: "Home" },
    { to: "/chat", label: "AI Analyst" },
    { to: "/trends", label: "Trends" },
    { to: "/marketplace", label: "Marketplace" },
    { to: "/pricing", label: "Pricing" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-deep/95 backdrop-blur-md border-b border-navy-light/20">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-primary-foreground">ScopeSG</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.to} to={l.to}>
              <Button
                variant="ghost"
                className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30 ${
                  location.pathname === l.to ? "text-accent bg-navy-light/20" : ""
                }`}
              >
                {l.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-primary-foreground/70 text-sm truncate max-w-[150px]">
                {user.user_metadata?.display_name || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground/70 hover:text-primary-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="gold" size="sm">Get Started Free</Button>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-primary-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-deep border-t border-navy-light/20 px-4 py-4 space-y-2">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-primary-foreground/70 hover:text-primary-foreground ${
                  location.pathname === l.to ? "text-accent" : ""
                }`}
              >
                {l.label}
              </Button>
            </Link>
          ))}
          {user ? (
            <Button variant="ghost" className="w-full justify-start text-primary-foreground/70" onClick={() => { signOut(); setMobileOpen(false); }}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)}>
              <Button variant="gold" className="w-full mt-2">Get Started Free</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
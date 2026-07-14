import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Clock, Handshake, Briefcase, Users, Megaphone, DollarSign,
  X, ChevronDown, Mail, RefreshCw, Pencil, Trash2, Flag,
  CircleAlert as AlertCircle, Loader as Loader2, CircleCheck as CheckCircle2, Calendar,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Filter } from "bad-words";

const profanityFilter = new Filter();

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType = "funding" | "partnership" | "hiring" | "general";

interface MarketplacePost {
  id: string;
  user_id: string;
  user_email: string;
  type: PostType;
  title: string;
  description: string;
  created_at: string;
  expires_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPES: { value: PostType; label: string; icon: React.ElementType; color: string }[] = [
  { value: "funding",     label: "Funding",     icon: DollarSign, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "partnership", label: "Partnership", icon: Handshake,  color: "text-blue-600   bg-blue-50   border-blue-200"   },
  { value: "hiring",      label: "Hiring",      icon: Users,      color: "text-violet-600 bg-violet-50 border-violet-200" },
  { value: "general",     label: "General",     icon: Megaphone,  color: "text-amber-600  bg-amber-50  border-amber-200"  },
];

const TYPE_MAP = Object.fromEntries(TYPES.map((t) => [t.value, t])) as Record<PostType, typeof TYPES[number]>;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: PostType }) {
  const t = TYPE_MAP[type];
  const Icon = t.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${t.color}`}>
      <Icon className="w-3 h-3" />
      {t.label}
    </span>
  );
}

interface PostFormProps {
  initial?: Partial<MarketplacePost>;
  onClose: () => void;
  onSaved: () => void;
  userEmail: string;
}

function PostForm({ initial, onClose, onSaved, userEmail }: PostFormProps) {
  const [type, setType]   = useState<PostType>(initial?.type ?? "general");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc,  setDesc]  = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);

  const isEdit = !!initial?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) return;
    if (profanityFilter.isProfane(title) || profanityFilter.isProfane(desc)) {
      toast.error("Your post contains inappropriate language. Please revise it.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        const { error } = await supabase
          .from("marketplace_posts")
          .update({ type, title: title.trim(), description: desc.trim() })
          .eq("id", initial.id!);
        if (error) throw error;
        toast.success("Post updated.");
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("You must be signed in to post.");
        const { error } = await supabase
          .from("marketplace_posts")
          .insert({
            type,
            title: title.trim(),
            description: desc.trim(),
            user_email: session.user.email ?? userEmail,
            user_id: session.user.id,
          });
        if (error) throw error;
        toast.success("Post published — visible for 7 days.");
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative z-10 w-full max-w-lg bg-navy-deep rounded-2xl border border-accent/30 p-6 shadow-2xl"
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        transition={{ duration: 0.22 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-primary-foreground">
            {isEdit ? "Edit Post" : "Post a Request"}
          </h2>
          <button onClick={onClose} className="text-primary-foreground/50 hover:text-primary-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-primary-foreground/60 mb-2 uppercase tracking-wide">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      type === t.value
                        ? "bg-accent/20 border-accent text-accent"
                        : "bg-white/5 border-white/10 text-primary-foreground/70 hover:border-white/30"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-primary-foreground/60 mb-1.5 uppercase tracking-wide">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Seeking seed investor for F&B startup"
              maxLength={120}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/40 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-primary-foreground/60 mb-1.5 uppercase tracking-wide">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe what you're looking for and any relevant details..."
              rows={4}
              maxLength={800}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/40 transition resize-none"
            />
            <p className="text-xs text-primary-foreground/30 mt-1 text-right">{desc.length}/800</p>
          </div>

          {!isEdit && (
            <p className="text-xs text-primary-foreground/40 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Post expires automatically after 7 days. You can renew it anytime.
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1 text-primary-foreground/70" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="flex-1 gap-2" disabled={saving || !title.trim() || !desc.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isEdit ? "Save Changes" : "Publish Post"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

interface PostCardProps {
  post: MarketplacePost;
  isOwn: boolean;
  isExpired: boolean;
  onEdit: (post: MarketplacePost) => void;
  onRenew: (postId: string) => void;
  onDelete: (postId: string) => void;
  onReport: (postId: string) => void;
  reported: boolean;
  index: number;
}

function PostCard({ post, isOwn, isExpired, onEdit, onRenew, onDelete, onReport, reported, index }: PostCardProps) {
  const [showEmail, setShowEmail] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const handleRenew = async () => {
    setRenewing(true);
    await onRenew(post.id);
    setRenewing(false);
  };

  const handleDelete = () => {
    setDeleteOpen(false);
    onDelete(post.id);
  };

  const handleReport = () => {
    setReportOpen(false);
    onReport(post.id);
  };

  const expiresIn = formatDistanceToNow(new Date(post.expires_at), { addSuffix: true });
  const postedAt  = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <motion.div
      className={`group rounded-xl border bg-card p-5 flex flex-col gap-4 transition-all ${
        isExpired
          ? "border-border/60 opacity-70"
          : "border-border hover:border-accent/30 hover:-translate-y-1"
      }`}
      style={{ boxShadow: isExpired ? undefined : "var(--shadow-card)" }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={index}
      variants={fadeUp}
    >
      <div className="flex items-start justify-between gap-3">
        <TypeBadge type={post.type} />
        {isExpired ? (
          <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium px-2 py-1 bg-destructive/10 rounded-full border border-destructive/20">
            <AlertCircle className="w-3 h-3" /> Expired
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <Clock className="w-3 h-3" /> {expiresIn}
          </span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-display font-semibold text-foreground mb-1.5 group-hover:text-accent transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.description}</p>
      </div>

      <div className="border-t border-border pt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{postedAt}</span>

        <div className="flex items-center gap-2">
          {isOwn ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs"
                onClick={() => onEdit(post)}
              >
                <Pencil className="w-3 h-3" /> Edit
              </Button>
              <Button
                size="sm"
                variant={isExpired ? "gold" : "outline"}
                className="gap-1.5 h-8 text-xs"
                onClick={handleRenew}
                disabled={renewing}
              >
                {renewing
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <RefreshCw className="w-3 h-3" />}
                Renew
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="w-3 h-3" /> Delete
              </Button>

              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This can't be undone. The post will be permanently removed from the marketplace.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {showEmail ? (
                <motion.a
                  href={`mailto:${post.user_email}`}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {post.user_email}
                </motion.a>
              ) : (
                <Button
                  size="sm"
                  variant="gold"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => setShowEmail(true)}
                >
                  <ChevronDown className="w-3 h-3" /> Respond
                </Button>
              )}

              {reported ? (
                <span className="text-xs text-muted-foreground italic">Reported</span>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setReportOpen(true)}
                  >
                    <Flag className="w-3 h-3" /> Report
                  </Button>

                  <AlertDialog open={reportOpen} onOpenChange={setReportOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Report this post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Report this post for inappropriate content? Our team will review it manually.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReport}>
                          Report
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterTab = "all" | "mine" | PostType;

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "mine",        label: "My Posts" },
  { value: "funding",     label: "Funding" },
  { value: "partnership", label: "Partnership" },
  { value: "hiring",      label: "Hiring" },
  { value: "general",     label: "General" },
];

const Marketplace = () => {
  const { user } = useAuth();

  const [posts,         setPosts]         = useState<MarketplacePost[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState<FilterTab>("all");
  const [showForm,      setShowForm]      = useState(false);
  const [editingPost,   setEditingPost]   = useState<MarketplacePost | null>(null);
  const [reportedIds,   setReportedIds]   = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Could not load posts.");
    } else {
      setPosts((data as MarketplacePost[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleRenew = async (postId: string) => {
    const { error } = await supabase
      .from("marketplace_posts")
      .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      .eq("id", postId);
    if (error) {
      toast.error("Could not renew post.");
    } else {
      toast.success("Post renewed for 7 more days.");
      await fetchPosts();
    }
  };

  const handleDelete = async (postId: string) => {
    const { error } = await supabase
      .from("marketplace_posts")
      .delete()
      .eq("id", postId);
    if (error) {
      toast.error("Could not delete post.");
    } else {
      toast.success("Post deleted.");
      await fetchPosts();
    }
  };

  const handleReport = async (postId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("post_reports")
      .insert({ post_id: postId, reporter_id: user.id });
    if (error) {
      toast.error("Could not submit report.");
    } else {
      toast.success("Report submitted. Our team will review it.");
      setReportedIds((prev) => new Set(prev).add(postId));
    }
  };

  const now = new Date();
  const activePosts = posts.filter((p) => new Date(p.expires_at) > now);

  // Build the display list based on the active filter tab
  let displayPosts: MarketplacePost[];
  if (filter === "mine") {
    displayPosts = user
      ? posts.filter((p) => p.user_id === user.id)
      : [];
  } else if (filter === "all") {
    displayPosts = activePosts;
  } else {
    displayPosts = activePosts.filter((p) => p.type === filter);
  }

  // Count for "My Posts" tab badge
  const myPostsCount = user
    ? posts.filter((p) => p.user_id === user.id).length
    : 0;

  const openCreateForm  = () => { setEditingPost(null); setShowForm(true); };
  const openEditForm    = (post: MarketplacePost) => { setEditingPost(post); setShowForm(true); };
  const closeForm       = () => { setShowForm(false); setEditingPost(null); };

  const getTabCount = (tab: FilterTab): number | null => {
    if (tab === "all") return activePosts.length;
    if (tab === "mine") return myPostsCount;
    return activePosts.filter((p) => p.type === tab).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Hero header */}
        <section className="py-12 md:py-16" style={{ background: "var(--gradient-hero)" }}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                  Marketplace
                </h1>
                <p className="text-primary-foreground/60 text-lg max-w-xl">
                  Post funding requests, partnership offers, hiring ads, or general business connections. Posts expire after 7 days.
                </p>
              </div>
              {user ? (
                <Button variant="gold" className="gap-2 shrink-0" onClick={openCreateForm}>
                  <Plus className="w-4 h-4" /> Post a Request
                </Button>
              ) : (
                <Button variant="gold" className="gap-2 shrink-0" onClick={() => window.location.href = "/auth"}>
                  <Plus className="w-4 h-4" /> Sign in to Post
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Feed */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              {TABS.map((tab) => {
                const count = getTabCount(tab.value);
                return (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      filter === tab.value
                        ? "bg-navy-deep text-primary-foreground border-accent/50 shadow-sm"
                        : "bg-card text-muted-foreground border-border hover:border-accent/30 hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {count !== null && (
                      <span className="ml-1.5 text-xs opacity-60">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-7 h-7 animate-spin text-accent" />
              </div>
            ) : displayPosts.length === 0 ? (
              <motion.div
                className="text-center py-24"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">
                  {filter === "mine"
                    ? "You haven't posted anything yet."
                    : "No posts yet in this category."}
                </p>
                {user && (
                  <Button variant="gold" className="mt-4 gap-2" onClick={openCreateForm}>
                    <Plus className="w-4 h-4" /> Post a Request
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayPosts.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isOwn={user?.id === post.user_id}
                    isExpired={new Date(post.expires_at) <= now}
                    onEdit={openEditForm}
                    onRenew={handleRenew}
                    onDelete={handleDelete}
                    onReport={handleReport}
                    reported={reportedIds.has(post.id)}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />

      {/* Post form modal */}
      <AnimatePresence>
        {showForm && user && (
          <PostForm
            key={editingPost?.id ?? "new"}
            initial={editingPost ?? undefined}
            onClose={closeForm}
            onSaved={fetchPosts}
            userEmail={user.email ?? ""}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileText, Globe, PenLine, BookOpen, ShieldAlert } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type KnowledgeEntry = {
  id: string;
  title: string;
  content: string;
  source_type: string;
  source_url: string | null;
  created_at: string;
};

const sourceIcons: Record<string, typeof FileText> = {
  manual: PenLine,
  essay: BookOpen,
  url: Globe,
  document: FileText,
};

const KnowledgeBase = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [sourceUrl, setSourceUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditor, setIsEditor] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Check if user has editor/admin role
  useEffect(() => {
    if (!user) return;
    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = data?.map((r: any) => r.role) || [];
      setIsEditor(roles.includes("editor") || roles.includes("admin"));
    };
    checkRole();
  }, [user]);

  useEffect(() => {
    if (isEditor) fetchEntries();
  }, [isEditor]);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setEntries(data);
  };

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("knowledge_base").insert({
      title: title.trim(),
      content: content.trim(),
      source_type: sourceType,
      source_url: sourceUrl.trim() || null,
    });
    if (error) {
      toast.error("Failed to save entry");
      console.error(error);
    } else {
      toast.success("Knowledge entry added! The AI will use this in future consultations.");
      setTitle("");
      setContent("");
      setSourceUrl("");
      setSourceType("manual");
      setIsAdding(false);
      fetchEntries();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entry removed");
    }
  };

  if (loading || isEditor === null) return null;

  if (!isEditor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 pb-12 px-4 max-w-4xl mx-auto text-center">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-destructive/50" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">This page is restricted to editors and administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Knowledge Base</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Add essays, articles, custom data — the AI will reference these during consultations.
            </p>
          </div>
          <Button variant="gold" onClick={() => setIsAdding(!isAdding)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Entry
          </Button>
        </div>

        {isAdding && (
          <Card className="p-6 mb-6 border-accent/20">
            <div className="space-y-4">
              <Input
                placeholder="Title (e.g. 'Singapore F&B Regulations 2025')"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                  <SelectItem value="essay">Essay / Article</SelectItem>
                  <SelectItem value="url">From URL</SelectItem>
                  <SelectItem value="document">Document Summary</SelectItem>
                </SelectContent>
              </Select>
              {sourceType === "url" && (
                <Input
                  placeholder="Source URL (optional)"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              )}
              <Textarea
                placeholder="Paste your content here — essays, notes, regulation summaries, market insights..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
              />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button variant="gold" onClick={handleAdd} disabled={saving}>
                  {saving ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {entries.length === 0 && !isAdding && (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No knowledge entries yet</p>
            <p className="text-sm">Add your essays, research, and custom data to make the AI smarter.</p>
          </div>
        )}

        <div className="space-y-3">
          {entries.map((entry) => {
            const Icon = sourceIcons[entry.source_type] || FileText;
            return (
              <Card key={entry.id} className="p-4 flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm">{entry.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{entry.source_type}</p>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{entry.content}</p>
                  {entry.source_url && (
                    <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline mt-1 block">
                      {entry.source_url}
                    </a>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;

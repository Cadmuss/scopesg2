import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Folder,
  FolderPlus,
  Search,
  MessageSquare,
  Trash2,
  Pencil,
  Tag,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  ChatFolder,
  ChatConversation,
} from "@/hooks/useChatHistory";

type Props = {
  folders: ChatFolder[];
  conversations: ChatConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onMoveConversation: (id: string, folderId: string | null) => void;
  onSetTags: (id: string, tags: string[]) => void;
};

const SUGGESTED_TAGS = ["Active", "Idea", "Research", "Archived", "Important"];

export default function ChatSidebar({
  folders,
  conversations,
  activeId,
  onSelect,
  onNew,
  onCreateFolder,
  onDeleteFolder,
  onDeleteConversation,
  onRenameConversation,
  onMoveConversation,
  onSetTags,
}: Props) {
  const [search, setSearch] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [conversations, search]);

  const grouped = useMemo(() => {
    const map = new Map<string | null, ChatConversation[]>();
    map.set(null, []);
    folders.forEach((f) => map.set(f.id, []));
    filtered.forEach((c) => {
      const key = c.folder_id && map.has(c.folder_id) ? c.folder_id : null;
      map.get(key)!.push(c);
    });
    return map;
  }, [filtered, folders]);

  const toggleFolder = (id: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTag = (conv: ChatConversation, tag: string) => {
    const has = conv.tags.includes(tag);
    onSetTags(conv.id, has ? conv.tags.filter((t) => t !== tag) : [...conv.tags, tag]);
  };

  const renderConv = (c: ChatConversation) => (
    <div
      key={c.id}
      className={`group relative flex items-start gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
        activeId === c.id ? "bg-accent/15 text-foreground" : "hover:bg-muted/60 text-muted-foreground"
      }`}
      onClick={() => onSelect(c.id)}
    >
      <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{c.title}</p>
        {c.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {c.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              setRenameId(c.id);
              setRenameValue(c.title);
            }}
          >
            <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">Move to folder</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onMoveConversation(c.id, null)}>
            <Folder className="w-3.5 h-3.5 mr-2" /> No folder
          </DropdownMenuItem>
          {folders.map((f) => (
            <DropdownMenuItem key={f.id} onClick={() => onMoveConversation(c.id, f.id)}>
              <Folder className="w-3.5 h-3.5 mr-2" /> {f.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">Tags</DropdownMenuLabel>
          {SUGGESTED_TAGS.map((t) => (
            <DropdownMenuItem key={t} onClick={() => toggleTag(c, t)}>
              <Tag className="w-3.5 h-3.5 mr-2" />
              <span className={c.tags.includes(t) ? "font-semibold text-accent" : ""}>{t}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              if (confirm("Delete this conversation?")) onDeleteConversation(c.id);
            }}
            className="text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-card/40 flex flex-col h-full">
      <div className="p-3 space-y-2 border-b border-border">
        <Button onClick={onNew} variant="gold" className="w-full gap-2">
          <Plus className="w-4 h-4" /> New consultation
        </Button>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chats & tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
              <FolderPlus className="w-3.5 h-3.5" /> New folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create folder</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="e.g. F&B Ideas"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button
                variant="gold"
                onClick={() => {
                  onCreateFolder(newFolderName);
                  setNewFolderName("");
                  setFolderDialogOpen(false);
                }}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Folders */}
        {folders.map((f) => {
          const list = grouped.get(f.id) || [];
          const collapsed = collapsedFolders.has(f.id);
          return (
            <div key={f.id}>
              <div className="flex items-center justify-between group px-1">
                <button
                  onClick={() => toggleFolder(f.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                >
                  {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <Folder className="w-3.5 h-3.5" style={{ color: f.color }} />
                  {f.name}
                  <span className="text-[10px] opacity-60">({list.length})</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete folder "${f.name}"? Chats inside will move to "All chats".`))
                      onDeleteFolder(f.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 space-y-0.5 pl-1"
                  >
                    {list.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic px-2 py-1">Empty</p>
                    ) : (
                      list.map(renderConv)
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Unfiled */}
        <div>
          <div className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> All chats
          </div>
          <div className="mt-1 space-y-0.5">
            {(grouped.get(null) || []).length === 0 ? (
              <p className="text-xs text-muted-foreground/60 italic px-2 py-2">
                No saved chats yet.
              </p>
            ) : (
              (grouped.get(null) || []).map(renderConv)
            )}
          </div>
        </div>
      </div>

      {/* Rename dialog */}
      <Dialog open={!!renameId} onOpenChange={(open) => !open && setRenameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="gold"
              onClick={() => {
                if (renameId && renameValue.trim()) {
                  onRenameConversation(renameId, renameValue.trim());
                }
                setRenameId(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocCard } from "@/components/documents/DocCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FileText, Plus, Loader2, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  createdAt: string;
  uploadedBy: { id: string; name: string | null; image: string | null };
}

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "insurance", label: "Insurance" },
  { value: "medication-list", label: "Medication List" },
  { value: "advance-directive", label: "Advance Directive" },
  { value: "lab-results", label: "Lab Results" },
  { value: "care-plan", label: "Care Plan" },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [careCircleId, setCareCircleId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch("/api/circles")
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]?.careCircleId) {
          setCareCircleId(data[0].careCircleId);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const loadDocuments = useCallback(async () => {
    if (!careCircleId) return;
    const catParam = filter !== "all" ? `&category=${filter}` : "";
    try {
      const res = await fetch(`/api/documents?careCircleId=${careCircleId}${catParam}`);
      const data = await res.json();
      if (Array.isArray(data)) setDocuments(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [careCircleId, filter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim() || !careCircleId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careCircleId,
          title: title.trim(),
          fileUrl: fileUrl.trim(),
          fileType,
          fileSize: 0,
          category,
          description: description || undefined,
        }),
      });
      if (res.ok) {
        setTitle("");
        setFileUrl("");
        setFileType("pdf");
        setCategory("general");
        setDescription("");
        setSheetOpen(false);
        await loadDocuments();
      }
    } finally {
      setSaving(false);
    }
  }

  const filtered = documents;

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Important care documents and files
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1" />
              Add
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Add Document</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleUpload} className="space-y-3 mt-4">
              <Input
                placeholder="Document title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                placeholder="File URL"
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={fileType} onValueChange={(v) => v && setFileType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="File type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="doc">Word Doc</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Document"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <Badge
          variant={filter === "all" ? "default" : "outline"}
          className="cursor-pointer flex-shrink-0"
          onClick={() => setFilter("all")}
        >
          All
        </Badge>
        {CATEGORIES.map((c) => (
          <Badge
            key={c.value}
            variant={filter === c.value ? "default" : "outline"}
            className="cursor-pointer flex-shrink-0"
            onClick={() => setFilter(c.value)}
          >
            {c.label}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No documents found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <DocCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

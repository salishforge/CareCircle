"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, File, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface DocCardProps {
  document: {
    id: string;
    title: string;
    description: string | null;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    category: string;
    createdAt: string;
    uploadedBy: { id: string; name: string | null; image: string | null };
  };
}

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  image: Image,
  doc: FileText,
  other: File,
};

const CATEGORY_COLORS: Record<string, string> = {
  insurance: "bg-blue-100 text-blue-700",
  "medication-list": "bg-purple-100 text-purple-700",
  "advance-directive": "bg-red-100 text-red-700",
  "lab-results": "bg-green-100 text-green-700",
  "care-plan": "bg-amber-100 text-amber-700",
  general: "bg-gray-100 text-gray-700",
};

export function DocCard({ document }: DocCardProps) {
  const FileIcon = FILE_ICONS[document.fileType] ?? File;
  const categoryColor = CATEGORY_COLORS[document.category] ?? CATEGORY_COLORS.general;
  const categoryLabel = document.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm truncate">{document.title}</h4>
              <Badge className={`text-[10px] ${categoryColor}`} variant="secondary">
                {categoryLabel}
              </Badge>
            </div>
            {document.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {document.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-muted-foreground">
                {document.uploadedBy.name ?? "Unknown"} · {format(new Date(document.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

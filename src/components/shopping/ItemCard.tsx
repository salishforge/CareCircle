"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, ShoppingCart, Trash2 } from "lucide-react";

interface Item {
  id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  notes?: string | null;
  priority: string;
  status: string;
  estimatedCost?: number | null;
  assignedTo?: { id: string; name: string | null; image: string | null } | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-coral",
  HIGH: "bg-amber",
  MEDIUM: "bg-sage",
  LOW: "bg-muted-foreground/40",
};

interface ItemCardProps {
  item: Item;
  currentUserId: string;
}

export function ItemCard({ item, currentUserId }: ItemCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(status: string) {
    setLoading(true);
    await fetch(`/api/shopping/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  async function deleteItem() {
    setLoading(true);
    await fetch(`/api/shopping/${item.id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  const isDone = item.status === "PURCHASED" || item.status === "DELIVERED";
  const isMine = item.assignedTo?.id === currentUserId;

  return (
    <div
      className={`flex items-center gap-3 py-3 px-1 border-b border-border last:border-0 ${
        isDone ? "opacity-50" : ""
      }`}
    >
      {/* Priority dot */}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.MEDIUM}`}
      />

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>
          {item.name}
          {item.quantity && (
            <span className="text-muted-foreground font-normal">
              {" "}
              — {item.quantity} {item.unit ?? ""}
            </span>
          )}
        </p>
        {item.notes && (
          <p className="text-xs text-muted-foreground truncate">{item.notes}</p>
        )}
        {item.assignedTo && (
          <div className="flex items-center gap-1 mt-0.5">
            <Avatar className="h-3.5 w-3.5">
              <AvatarImage src={item.assignedTo.image ?? undefined} />
              <AvatarFallback className="text-[8px]">
                {item.assignedTo.name?.[0] ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {isMine ? "Claimed by you" : `Claimed by ${item.assignedTo.name}`}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!isDone && item.status === "NEEDED" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => update("CLAIMED")}
            disabled={loading}
            title="Claim this item"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        )}
        {!isDone && item.status === "CLAIMED" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sage"
            onClick={() => update("PURCHASED")}
            disabled={loading}
            title="Mark as purchased"
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
        {isDone && (
          <Circle className="h-4 w-4 text-muted-foreground/40" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-coral"
          onClick={deleteItem}
          disabled={loading}
          title="Delete item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

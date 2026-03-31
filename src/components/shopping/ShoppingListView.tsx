"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemCard } from "./ItemCard";
import { Plus, ShoppingBasket } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "🥦 Food",
  MEDICAL: "💊 Medical",
  HOME: "🏠 Home",
  PERSONAL: "🪥 Personal",
};

interface ShoppingItem {
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

interface ShoppingList {
  id: string;
  title: string;
  category: string;
  items: ShoppingItem[];
}

interface ShoppingListViewProps {
  lists: ShoppingList[];
  careCircleId: string;
  currentUserId: string;
}

export function ShoppingListView({ lists, careCircleId, currentUserId }: ShoppingListViewProps) {
  const router = useRouter();
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPriority, setNewItemPriority] = useState("MEDIUM");
  const [loading, setLoading] = useState(false);

  async function addItem(listId: string) {
    if (!newItemName.trim()) return;
    setLoading(true);
    await fetch("/api/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listId,
        name: newItemName.trim(),
        priority: newItemPriority,
      }),
    });
    setLoading(false);
    setNewItemName("");
    setAddingToList(null);
    router.refresh();
  }

  if (lists.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBasket className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground font-medium">No shopping lists yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Items added here can be picked up by anyone in the care circle.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lists.map((list) => {
        const needsCount = list.items.filter((i) => i.status === "NEEDED").length;
        const doneCount = list.items.filter(
          (i) => i.status === "PURCHASED" || i.status === "DELIVERED"
        ).length;

        return (
          <Card key={list.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {CATEGORY_LABELS[list.category] ?? list.category} — {list.title}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {doneCount}/{list.items.length} done
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {list.items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No items yet.</p>
              ) : (
                <div>
                  {list.items.map((item) => (
                    <ItemCard key={item.id} item={item} currentUserId={currentUserId} />
                  ))}
                </div>
              )}

              {/* Add item inline */}
              {addingToList === list.id ? (
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addItem(list.id);
                      if (e.key === "Escape") setAddingToList(null);
                    }}
                    className="h-9 flex-1"
                    autoFocus
                  />
                  <Select value={newItemPriority} onValueChange={(v) => v && setNewItemPriority(v)}>
                    <SelectTrigger className="h-9 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="h-9"
                    onClick={() => addItem(list.id)}
                    disabled={loading || !newItemName.trim()}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-9 text-muted-foreground gap-1.5"
                  onClick={() => setAddingToList(list.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add item
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

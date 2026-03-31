"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function ListsPage() {
  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Shopping Lists</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Food, supplies, and everything in between
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Lists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">No lists yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add items anyone in the care circle can pick up!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

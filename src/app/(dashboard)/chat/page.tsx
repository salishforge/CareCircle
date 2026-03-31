"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Care Assistant</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Ask me anything about your care
        </p>
      </div>

      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              AI assistant coming soon.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ask about your schedule, meals, or make requests.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

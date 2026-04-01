"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6 py-6">
      <Card>
        <CardContent className="pt-8 pb-6 text-center">
          <div className="h-12 w-12 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-coral" />
          </div>
          <h2 className="text-lg font-bold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-2">
            We couldn&apos;t load this page. Please try again.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <p className="text-xs text-red-500 mt-3 font-mono bg-red-50 rounded p-2 break-all">
              {error.message}
            </p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" render={<Link href="/" />}>
              Go Home
            </Button>
            <Button onClick={reset}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

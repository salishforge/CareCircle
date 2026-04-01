"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="h-12 w-12 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-coral" />
          </div>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mt-2">
            We hit an unexpected error. Please try again.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <p className="text-xs text-red-500 mt-3 font-mono bg-red-50 rounded p-2 break-all">
              {error.message}
            </p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
            <Button onClick={reset}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="space-y-6 py-6">
      <Card>
        <CardContent className="pt-8 pb-6 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold">Page not found</h2>
          <p className="text-sm text-muted-foreground mt-2">
            This page doesn&apos;t exist. Head back to the dashboard.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/">Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

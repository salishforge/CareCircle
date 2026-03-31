import { prisma } from "@/lib/prisma";
import { WallDisplay } from "./WallDisplay";

interface PageProps {
  searchParams: Promise<{ circleId?: string; token?: string }>;
}

export default async function DisplayPage({ searchParams }: PageProps) {
  const { circleId, token } = await searchParams;

  if (!circleId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Missing circleId parameter</p>
          <p className="text-muted-foreground mt-2">
            Add <code className="bg-muted px-1 py-0.5 rounded">?circleId=xxx</code> to the URL
          </p>
        </div>
      </div>
    );
  }

  // Validate display token if configured
  const displayToken = process.env.DISPLAY_TOKEN;
  if (displayToken && token !== displayToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold text-muted-foreground">Invalid display token.</p>
      </div>
    );
  }

  const circle = await prisma.careCircle.findUnique({
    where: { id: circleId },
    include: {
      patient: { select: { name: true } },
    },
  });

  if (!circle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold text-muted-foreground">Care circle not found.</p>
      </div>
    );
  }

  const patientName = circle.patient?.name ?? circle.name;

  return (
    <WallDisplay
      circleId={circleId}
      token={token ?? ""}
      patientName={patientName}
    />
  );
}

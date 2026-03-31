import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcceptInviteButton } from "./AcceptInviteButton";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const invite = await prisma.invite.findUnique({
    where: { code },
    include: {
      careCircle: {
        include: {
          patient: { select: { name: true } },
          _count: { select: { members: true } },
        },
      },
    },
  });

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold">Invite not found</p>
            <p className="text-sm text-muted-foreground mt-2">
              This invite link may have expired or been used.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold">Invite expired</p>
            <p className="text-sm text-muted-foreground mt-2">
              Ask the care circle admin for a new invite link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.usedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold">Already used</p>
            <p className="text-sm text-muted-foreground mt-2">
              This invite has already been accepted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/invite/${code}`);
  }

  // Check if already a member
  const existing = await prisma.careCircleMember.findUnique({
    where: {
      careCircleId_userId: {
        careCircleId: invite.careCircleId,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            Join {invite.careCircle.patient.name}&apos;s Care Circle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            You&apos;ve been invited to join{" "}
            <strong>{invite.careCircle.name}</strong> as a{" "}
            {invite.role?.toLowerCase().replace("_", " ") || "caregiver"}.
          </p>
          <p className="text-sm text-muted-foreground">
            {invite.careCircle._count.members} member
            {invite.careCircle._count.members !== 1 ? "s" : ""} already in the
            circle.
          </p>
          <AcceptInviteButton
            inviteCode={code}
            circleName={invite.careCircle.name}
          />
        </CardContent>
      </Card>
    </div>
  );
}

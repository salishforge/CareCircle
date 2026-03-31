import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await context.params;

  const invite = await prisma.invite.findUnique({
    where: { code },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  if (invite.usedAt) {
    return NextResponse.json({ error: "Invite already used" }, { status: 409 });
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
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  // Accept invite in a transaction
  await prisma.$transaction([
    prisma.careCircleMember.create({
      data: {
        careCircleId: invite.careCircleId,
        userId: session.user.id,
        role: invite.role || "CAREGIVER",
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
        usedById: session.user.id,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}

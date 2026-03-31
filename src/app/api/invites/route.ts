import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuid } from "uuid";
import { z } from "zod";

const createInviteSchema = z.object({
  careCircleId: z.string(),
  role: z.enum(["CAREGIVER", "MEAL_PROVIDER", "PATIENT"]).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createInviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { careCircleId, role } = parsed.data;

  // Verify user is a member of this circle
  const membership = await prisma.careCircleMember.findUnique({
    where: {
      careCircleId_userId: { careCircleId, userId: session.user.id },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this care circle" }, { status: 403 });
  }

  const code = uuid().replace(/-/g, "").slice(0, 12);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.invite.create({
    data: {
      careCircleId,
      code,
      role: role || null,
      createdById: session.user.id,
      expiresAt,
    },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${invite.code}`;

  return NextResponse.json({ ...invite, inviteUrl }, { status: 201 });
}

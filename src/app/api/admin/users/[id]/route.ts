import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin(userId: string): Promise<Response | null> {
  const membership = await prisma.careCircleMember.findFirst({
    where: {
      userId,
      isActive: true,
      role: { in: ["ADMIN", "PRIMARY_CAREGIVER"] },
    },
  });
  if (!membership) {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }
  return null;
}

const updateSchema = z.object({
  role: z.enum(["PATIENT", "PRIMARY_CAREGIVER", "CAREGIVER", "MEAL_PROVIDER", "ADMIN"]).optional(),
  isLocked: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminError = await requireAdmin(session.user.id);
  if (adminError) return adminError;

  const { id: targetUserId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Update user-level fields (isLocked)
  if (parsed.data.isLocked !== undefined) {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { isLocked: parsed.data.isLocked },
    });
  }

  // Update circle membership fields (role, isActive)
  const membershipUpdates: Record<string, unknown> = {};
  if (parsed.data.role !== undefined) membershipUpdates.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) membershipUpdates.isActive = parsed.data.isActive;

  if (Object.keys(membershipUpdates).length > 0) {
    const membership = await prisma.careCircleMember.findFirst({
      where: { userId: targetUserId },
    });
    if (membership) {
      await prisma.careCircleMember.update({
        where: { id: membership.id },
        data: membershipUpdates,
      });
    }
  }

  return Response.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminError = await requireAdmin(session.user.id);
  if (adminError) return adminError;

  const { id: targetUserId } = await params;

  // Cannot remove yourself via admin panel
  if (targetUserId === session.user.id) {
    return Response.json({ error: "Cannot remove yourself. Use account deletion instead." }, { status: 400 });
  }

  // Soft-remove: deactivate membership
  const membership = await prisma.careCircleMember.findFirst({
    where: { userId: targetUserId },
  });

  if (membership) {
    await prisma.careCircleMember.update({
      where: { id: membership.id },
      data: { isActive: false },
    });
  }

  return Response.json({ success: true });
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Safety: cannot delete if last ADMIN/PRIMARY_CAREGIVER
  const adminMemberships = await prisma.careCircleMember.findMany({
    where: {
      isActive: true,
      role: { in: ["ADMIN", "PRIMARY_CAREGIVER"] },
    },
  });

  const otherAdmins = adminMemberships.filter((m) => m.userId !== userId);
  const isAdmin = adminMemberships.some((m) => m.userId === userId);

  if (isAdmin && otherAdmins.length === 0) {
    return Response.json(
      { error: "You are the last admin. Please assign another admin before deleting your account." },
      { status: 400 }
    );
  }

  // Delete: memberships first (cascade won't cover CareCircleMember unique constraint cleanly)
  await prisma.careCircleMember.deleteMany({ where: { userId } });

  // Delete the user (cascades to notifications, checkIns, moodEntries, etc.)
  await prisma.user.delete({ where: { id: userId } });

  return Response.json({ success: true });
}

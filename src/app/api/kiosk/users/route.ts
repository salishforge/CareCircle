import { prisma } from "@/lib/prisma";

/**
 * Public endpoint for kiosk login screen.
 * Returns minimal user data: id, name, image, hasPin.
 * No authentication required (kiosk needs this before login).
 */
export async function GET() {
  // Get the first care circle's active members
  const circle = await prisma.careCircle.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!circle) {
    return Response.json([]);
  }

  const members = await prisma.careCircleMember.findMany({
    where: { careCircleId: circle.id, isActive: true },
    include: {
      user: true,
    },
    orderBy: { joinedAt: "asc" },
  });

  return Response.json(
    members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      image: m.user.image,
      role: m.role,
      hasPin: !!(m.user as Record<string, unknown>).kioskPin,
    }))
  );
}

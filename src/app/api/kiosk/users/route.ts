import { prisma } from "@/lib/prisma";

/**
 * Public endpoint for kiosk login screen.
 * Returns minimal user data: id, name, image, hasPin.
 * No authentication required (kiosk needs this before login).
 */
export async function GET() {
  try {
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
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    // Try to get full user data including kioskPin
    let usersWithPin: Record<string, boolean> = {};
    try {
      const fullUsers = await prisma.user.findMany({
        where: { id: { in: members.map((m) => m.user.id) } },
      });
      for (const u of fullUsers) {
        usersWithPin[u.id] = !!(u as Record<string, unknown>).kioskPin;
      }
    } catch {
      // kioskPin column may not exist — all false
    }

    return Response.json(
      members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        image: m.user.image,
        role: m.role,
        hasPin: usersWithPin[m.user.id] ?? false,
      }))
    );
  } catch (err) {
    console.error("Kiosk users error:", err);
    return Response.json([]);
  }
}

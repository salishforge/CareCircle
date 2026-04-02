import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCircleMembership } from "@/lib/auth-utils";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date: dateStr } = await params;
  const { searchParams } = new URL(request.url);
  const careCircleId = searchParams.get("careCircleId");

  if (!careCircleId) {
    return Response.json({ error: "careCircleId required" }, { status: 400 });
  }

  const membershipError = await requireCircleMembership(session.user.id, careCircleId);
  if (membershipError) return membershipError;

  const date = new Date(dateStr + "T00:00:00");
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const [shifts, meals, appointments] = await Promise.all([
    prisma.careShift.findMany({
      where: {
        careCircleId,
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        primaryCaregiver: {
          select: { id: true, name: true, image: true, phone: true, email: true },
        },
        alternateCaregiver: {
          select: { id: true, name: true, image: true, phone: true, email: true },
        },
      },
      orderBy: { startTime: "asc" },
    }),

    prisma.meal.findMany({
      where: {
        mealPlan: { careCircleId },
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        provider: { select: { id: true, name: true, image: true } },
      },
      orderBy: { mealType: "asc" },
    }),

    prisma.appointment.findMany({
      where: {
        careCircleId,
        dateTime: { gte: dayStart, lte: dayEnd },
      },
      include: {
        transportationVolunteer: {
          select: { id: true, name: true, phone: true, email: true, image: true },
        },
      },
      orderBy: { dateTime: "asc" },
    }),
  ]);

  return Response.json({ date: dateStr, shifts, meals, appointments });
}

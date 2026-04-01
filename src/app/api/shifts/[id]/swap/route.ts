import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma/client";
import { z } from "zod";

const swapSchema = z.object({
  reason: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: shiftId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = swapSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const shift = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: {
      primaryCaregiver: { select: { name: true } },
      careCircle: {
        include: {
          members: {
            where: { isActive: true, role: { in: ["PRIMARY_CAREGIVER", "ADMIN"] } },
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!shift) {
    return Response.json({ error: "Shift not found" }, { status: 404 });
  }

  if (shift.primaryCaregiverId !== session.user.id) {
    return Response.json({ error: "Only the assigned caregiver can request a swap" }, { status: 403 });
  }

  // Check for existing pending swap
  const existing = await prisma.shiftSwapRequest.findFirst({
    where: { originalShiftId: shiftId, status: "PENDING" },
  });
  if (existing) {
    return Response.json({ error: "A swap request is already pending" }, { status: 409 });
  }

  const swap = await prisma.shiftSwapRequest.create({
    data: {
      originalShiftId: shiftId,
      requesterId: session.user.id,
      reason: parsed.data.reason ?? null,
    },
    include: {
      requester: { select: { id: true, name: true } },
      originalShift: {
        select: { startTime: true, endTime: true, date: true },
      },
    },
  });

  // Notify admins/primary caregivers
  const caregiverName = shift.primaryCaregiver?.name ?? "A caregiver";
  await Promise.allSettled(
    shift.careCircle.members
      .filter((m) => m.user.id !== session.user.id)
      .map((m) =>
        prisma.notification.create({
          data: {
            userId: m.user.id,
            type: NotificationType.SHIFT_CONFIRMATION,
            title: "Shift swap requested",
            body: `${caregiverName} is requesting a swap for their shift. Reason: ${parsed.data.reason || "Not specified"}`,
            data: { swapId: swap.id, shiftId },
          },
        })
      )
  );

  return Response.json(swap, { status: 201 });
}

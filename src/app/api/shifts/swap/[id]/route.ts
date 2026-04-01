import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["APPROVED", "DENIED"]),
  newCaregiverId: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const swap = await prisma.shiftSwapRequest.findUnique({
    where: { id },
    include: {
      originalShift: {
        include: { careCircle: true },
      },
      requester: { select: { id: true, name: true } },
    },
  });

  if (!swap) {
    return Response.json({ error: "Swap request not found" }, { status: 404 });
  }

  if (swap.status !== "PENDING") {
    return Response.json({ error: "Swap already processed" }, { status: 409 });
  }

  // Verify approver is admin/primary caregiver
  const membership = await prisma.careCircleMember.findFirst({
    where: {
      careCircleId: swap.originalShift.careCircleId,
      userId: session.user.id,
      isActive: true,
      role: { in: ["PRIMARY_CAREGIVER", "ADMIN"] },
    },
  });

  if (!membership) {
    return Response.json({ error: "Only admins can approve swaps" }, { status: 403 });
  }

  const updated = await prisma.shiftSwapRequest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      newCaregiverId: parsed.data.newCaregiverId ?? null,
    },
  });

  // If approved with a new caregiver, update the shift
  if (parsed.data.status === "APPROVED" && parsed.data.newCaregiverId) {
    await prisma.careShift.update({
      where: { id: swap.originalShiftId },
      data: { primaryCaregiverId: parsed.data.newCaregiverId },
    });
  } else if (parsed.data.status === "APPROVED" && !parsed.data.newCaregiverId) {
    // Set shift back to OPEN
    await prisma.careShift.update({
      where: { id: swap.originalShiftId },
      data: { primaryCaregiverId: null, status: "OPEN" },
    });
  }

  // Notify the requester
  await prisma.notification.create({
    data: {
      userId: swap.requesterId,
      type: NotificationType.SHIFT_CONFIRMATION,
      title: `Swap ${parsed.data.status === "APPROVED" ? "approved" : "denied"}`,
      body: `Your shift swap request has been ${parsed.data.status.toLowerCase()}.`,
      data: { swapId: id },
    },
  });

  return Response.json(updated);
}

export async function GET(
  request: Request,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const careCircleId = searchParams.get("careCircleId");

  if (!careCircleId) {
    return Response.json({ error: "careCircleId required" }, { status: 400 });
  }

  const swaps = await prisma.shiftSwapRequest.findMany({
    where: {
      originalShift: { careCircleId },
    },
    include: {
      requester: { select: { id: true, name: true, image: true } },
      originalShift: {
        select: { id: true, date: true, startTime: true, endTime: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return Response.json(swaps);
}

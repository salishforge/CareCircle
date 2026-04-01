import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCircleMembership } from "@/lib/auth-utils";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "FULFILLED", "CANCELLED"]).optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
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

  const existing = await prisma.patientRequest.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const membershipError = await requireCircleMembership(session.user.id, existing.careCircleId);
  if (membershipError) return membershipError;

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "FULFILLED") {
      updateData.fulfilledAt = new Date();
    }
  }
  if (parsed.data.assignedToId !== undefined) {
    updateData.assignedToId = parsed.data.assignedToId;
    if (!updateData.status) updateData.status = "IN_PROGRESS";
  }
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const updated = await prisma.patientRequest.update({
    where: { id },
    data: updateData,
    include: {
      patient: { select: { id: true, name: true, image: true } },
      assignedTo: { select: { id: true, name: true, image: true } },
    },
  });

  return Response.json(updated);
}

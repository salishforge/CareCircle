import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCircleMembership } from "@/lib/auth-utils";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  dateTime: z.string().optional(),
  duration: z.number().int().positive().optional(),
  type: z.enum(["MEDICAL", "THERAPY", "OTHER"]).optional(),
  transportationNeeded: z.boolean().optional(),
  transportationVolunteerId: z.string().optional(),
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

  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const membershipError = await requireCircleMembership(session.user.id, existing.careCircleId);
  if (membershipError) return membershipError;

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
  if (parsed.data.dateTime) updateData.dateTime = new Date(parsed.data.dateTime);
  if (parsed.data.duration) updateData.duration = parsed.data.duration;
  if (parsed.data.type) updateData.type = parsed.data.type;
  if (parsed.data.transportationNeeded !== undefined)
    updateData.transportationNeeded = parsed.data.transportationNeeded;
  if (parsed.data.transportationVolunteerId !== undefined)
    updateData.transportationVolunteerId = parsed.data.transportationVolunteerId;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const appointment = await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      transportationVolunteer: { select: { id: true, name: true, phone: true } },
    },
  });

  return Response.json(appointment);
}

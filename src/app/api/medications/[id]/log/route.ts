import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const logSchema = z.object({
  medicationName: z.string().min(1),
  skipped: z.boolean().default(false),
  notes: z.string().optional(),
  scheduledTime: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Verify medication exists
  const med = await prisma.medicationEntry.findUnique({ where: { id } });
  if (!med) {
    return Response.json({ error: "Medication not found" }, { status: 404 });
  }

  const log = await prisma.medicationLog.create({
    data: {
      userId: session.user.id,
      medicationName: parsed.data.medicationName,
      skipped: parsed.data.skipped,
      notes: parsed.data.notes ?? null,
      scheduledTime: parsed.data.scheduledTime ? new Date(parsed.data.scheduledTime) : null,
    },
  });

  return Response.json(log, { status: 201 });
}

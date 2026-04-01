import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMedSchema = z.object({
  careCircleId: z.string().optional(),
  name: z.string().min(1),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  timing: z.string().optional(),
  foodInteractions: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId") ?? session.user.id;

  const medications = await prisma.medicationEntry.findMany({
    where: { patientId, isActive: true },
    orderBy: { name: "asc" },
  });

  // Also fetch today's logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayLogs = await prisma.medicationLog.findMany({
    where: {
      userId: patientId,
      takenAt: { gte: today, lt: tomorrow },
    },
    orderBy: { takenAt: "desc" },
  });

  return Response.json({ medications, todayLogs });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createMedSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const medication = await prisma.medicationEntry.create({
    data: {
      patientId: session.user.id,
      careCircleId: parsed.data.careCircleId ?? null,
      name: parsed.data.name,
      dosage: parsed.data.dosage ?? null,
      frequency: parsed.data.frequency ?? null,
      timing: parsed.data.timing ?? null,
      foodInteractions: parsed.data.foodInteractions,
      notes: parsed.data.notes ?? null,
    },
  });

  return Response.json(medication, { status: 201 });
}

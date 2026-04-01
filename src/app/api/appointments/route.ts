import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const appointmentSchema = z.object({
  careCircleId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  dateTime: z.string(),
  duration: z.number().int().positive().default(60),
  type: z.enum(["MEDICAL", "THERAPY", "OTHER"]).default("MEDICAL"),
  transportationNeeded: z.boolean().default(false),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const careCircleId = searchParams.get("careCircleId");
  const upcoming = searchParams.get("upcoming") !== "false";

  if (!careCircleId) {
    return Response.json({ error: "careCircleId required" }, { status: 400 });
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      careCircleId,
      ...(upcoming ? { dateTime: { gte: new Date() } } : {}),
    },
    include: {
      transportationVolunteer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { dateTime: "asc" },
    take: 20,
  });

  return Response.json(appointments);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      careCircleId: parsed.data.careCircleId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      location: parsed.data.location ?? null,
      dateTime: new Date(parsed.data.dateTime),
      duration: parsed.data.duration,
      type: parsed.data.type,
      transportationNeeded: parsed.data.transportationNeeded,
      notes: parsed.data.notes ?? null,
    },
    include: {
      transportationVolunteer: { select: { id: true, name: true, phone: true } },
    },
  });

  return Response.json(appointment, { status: 201 });
}

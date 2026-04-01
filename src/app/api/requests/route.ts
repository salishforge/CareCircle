import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const requestSchema = z.object({
  careCircleId: z.string(),
  type: z.enum(["MEAL", "SCHEDULE", "TRANSPORT", "SUPPLY", "OTHER"]),
  description: z.string().min(1),
  priority: z.enum(["LOW", "NORMAL", "URGENT"]).default("NORMAL"),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const careCircleId = searchParams.get("careCircleId");
  const status = searchParams.get("status"); // OPEN, IN_PROGRESS, FULFILLED, CANCELLED

  if (!careCircleId) {
    return Response.json({ error: "careCircleId required" }, { status: 400 });
  }

  const requests = await prisma.patientRequest.findMany({
    where: {
      careCircleId,
      ...(status ? { status: status as "OPEN" | "IN_PROGRESS" | "FULFILLED" | "CANCELLED" } : {}),
    },
    include: {
      patient: { select: { id: true, name: true, image: true } },
      assignedTo: { select: { id: true, name: true, image: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return Response.json(requests);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const patientRequest = await prisma.patientRequest.create({
    data: {
      careCircleId: parsed.data.careCircleId,
      patientId: session.user.id,
      type: parsed.data.type,
      description: parsed.data.description,
      priority: parsed.data.priority,
    },
    include: {
      patient: { select: { id: true, name: true, image: true } },
      assignedTo: { select: { id: true, name: true, image: true } },
    },
  });

  return Response.json(patientRequest, { status: 201 });
}

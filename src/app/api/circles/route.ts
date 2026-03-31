import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCircleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  patientId: z.string().optional(),
  timezone: z.string().default("America/Los_Angeles"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const circles = await prisma.careCircle.findMany({
    where: {
      members: { some: { userId: session.user.id, isActive: true } },
    },
    include: {
      patient: { select: { id: true, name: true, image: true } },
      members: {
        where: { isActive: true },
        include: { user: { select: { id: true, name: true, image: true, role: true } } },
      },
      _count: { select: { shifts: true } },
    },
  });

  return NextResponse.json(circles);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createCircleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, patientId, timezone } = parsed.data;

  const circle = await prisma.careCircle.create({
    data: {
      name,
      patientId: patientId || session.user.id,
      timezone,
      members: {
        create: {
          userId: session.user.id,
          role: "PRIMARY_CAREGIVER",
        },
      },
    },
    include: {
      patient: { select: { id: true, name: true } },
      members: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json(circle, { status: 201 });
}

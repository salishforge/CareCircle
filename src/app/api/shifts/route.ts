import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCircleMembership } from "@/lib/auth-utils";
import { z } from "zod";
import { startOfWeek, endOfWeek } from "date-fns";

const createShiftSchema = z.object({
  careCircleId: z.string(),
  date: z.string(), // ISO date string
  startTime: z.string(), // ISO datetime
  endTime: z.string(), // ISO datetime
  notes: z.string().optional(),
});

const claimShiftSchema = z.object({
  shiftId: z.string(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const careCircleId = searchParams.get("careCircleId");
  const weekOf = searchParams.get("weekOf");

  if (!careCircleId) {
    return NextResponse.json({ error: "careCircleId required" }, { status: 400 });
  }

  const membershipError = await requireCircleMembership(session.user.id, careCircleId);
  if (membershipError) return membershipError;

  const refDate = weekOf ? new Date(weekOf) : new Date();
  const weekStart = startOfWeek(refDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(refDate, { weekStartsOn: 0 });

  const shifts = await prisma.careShift.findMany({
    where: {
      careCircleId,
      date: { gte: weekStart, lte: weekEnd },
    },
    include: {
      primaryCaregiver: {
        select: { id: true, name: true, image: true, phone: true },
      },
      alternateCaregiver: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(shifts);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Handle claiming an existing open shift
  if (body.action === "claim") {
    const parsed = claimShiftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const shift = await prisma.careShift.findUnique({
      where: { id: parsed.data.shiftId },
    });

    if (!shift || shift.status !== "OPEN") {
      return NextResponse.json(
        { error: "Shift not available" },
        { status: 409 }
      );
    }

    // Check for overlapping shifts
    const overlapping = await prisma.careShift.findFirst({
      where: {
        primaryCaregiverId: session.user.id,
        status: { not: "OPEN" },
        OR: [
          {
            startTime: { lt: shift.endTime },
            endTime: { gt: shift.startTime },
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "You have an overlapping shift" },
        { status: 409 }
      );
    }

    const updated = await prisma.careShift.update({
      where: { id: shift.id },
      data: {
        primaryCaregiverId: session.user.id,
        status: "CLAIMED",
      },
      include: {
        primaryCaregiver: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(updated);
  }

  // Create a new shift
  const parsed = createShiftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { careCircleId, date, startTime, endTime, notes } = parsed.data;

  const membershipError = await requireCircleMembership(session.user.id, careCircleId);
  if (membershipError) return membershipError;

  const shift = await prisma.careShift.create({
    data: {
      careCircleId,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "OPEN",
      notes: notes || null,
    },
  });

  return NextResponse.json(shift, { status: 201 });
}

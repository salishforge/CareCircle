import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { subDays, startOfDay } from "date-fns";

const moodSchema = z.object({
  mood: z.number().int().min(1).max(5),
  energyLevel: z.number().int().min(1).max(5).optional(),
  painLevel: z.number().int().min(0).max(10).optional(),
  appetite: z.number().int().min(1).max(5).optional(),
  sleepQuality: z.number().int().min(1).max(5).optional(),
  symptoms: z.array(z.string()).default([]),
  notes: z.string().optional(),
  isPrivate: z.boolean().default(true),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "7", 10);
  const since = startOfDay(subDays(new Date(), days));

  const entries = await prisma.moodEntry.findMany({
    where: {
      userId: session.user.id,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
  });

  return Response.json(entries);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = moodSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const today = startOfDay(new Date());

  // Upsert — one entry per day
  const entry = await prisma.moodEntry.upsert({
    where: {
      userId_date: { userId: session.user.id, date: today },
    },
    create: {
      userId: session.user.id,
      date: today,
      ...parsed.data,
    },
    update: parsed.data,
  });

  return Response.json(entry, { status: 201 });
}

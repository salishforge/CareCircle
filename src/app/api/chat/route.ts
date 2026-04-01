import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { z } from "zod";

const messageSchema = z.object({
  careCircleId: z.string(),
  message: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { careCircleId, message } = parsed.data;

  // Verify membership
  const membership = await prisma.careCircleMember.findFirst({
    where: { careCircleId, userId: session.user.id, isActive: true },
    include: { careCircle: true },
  });

  if (!membership) {
    return Response.json({ error: "Not a member of this care circle" }, { status: 403 });
  }

  // Save user message
  await prisma.chatMessage.create({
    data: {
      careCircleId,
      userId: session.user.id,
      role: "USER",
      content: message,
    },
  });

  // Fetch context for the AI
  const [recentMessages, todayShifts, recentMood, activeRequests] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { careCircleId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { role: true, content: true },
    }),
    prisma.careShift.findMany({
      where: {
        careCircleId,
        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: { primaryCaregiver: { select: { name: true } } },
      take: 5,
    }),
    prisma.moodEntry.findFirst({
      where: { userId: membership.careCircle.patientId },
      orderBy: { date: "desc" },
    }),
    prisma.patientRequest.count({
      where: { careCircleId, status: "OPEN" },
    }),
  ]);

  const history = recentMessages.reverse().map((m) => ({
    role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  const scheduleContext = todayShifts
    .map(
      (s) =>
        `${s.primaryCaregiver?.name ?? "Unassigned"}: ${new Date(s.startTime).toLocaleTimeString()} - ${new Date(s.endTime).toLocaleTimeString()} (${s.status})`
    )
    .join("\n");

  const moodContext = recentMood
    ? `Latest mood: ${recentMood.mood}/5, energy: ${recentMood.energyLevel ?? "N/A"}/5, pain: ${recentMood.painLevel ?? "N/A"}/10`
    : "No recent mood entries";

  const systemPrompt = `You are a compassionate care assistant for "${membership.careCircle.name}". You help coordinate care, answer questions, and provide support.

Current context:
- User: ${session.user.name ?? "Unknown"} (role: ${membership.role})
- Date: ${new Date().toLocaleDateString()}
- Today's schedule:\n${scheduleContext || "No shifts scheduled"}
- ${moodContext}
- Open requests: ${activeRequests}

Guidelines:
- Be warm, concise, and helpful
- If asked about medications, suggest checking the Medications page
- For emergencies, always advise calling 911 or the emergency contact
- You can help with scheduling questions, meal info, and general care coordination
- Keep responses brief and actionable`;

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: systemPrompt,
    messages: history,
    maxOutputTokens: 500,
    async onFinish({ text }) {
      await prisma.chatMessage.create({
        data: {
          careCircleId,
          userId: session.user.id,
          role: "ASSISTANT",
          content: text,
        },
      });
    },
  });

  return result.toTextStreamResponse();
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const careCircleId = searchParams.get("careCircleId");

  if (!careCircleId) {
    return Response.json({ error: "careCircleId required" }, { status: 400 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { careCircleId },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
      user: { select: { name: true, image: true } },
    },
  });

  return Response.json(messages);
}

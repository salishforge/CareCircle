import { prisma } from "@/lib/prisma";
import {
  isCheckInReply,
  validateTwilioSignature,
} from "@/lib/twilio";
import {
  CheckInMethod,
  CheckInStatus,
  ShiftStatus,
  EscalationResolution,
  NotificationType,
} from "@/generated/prisma/client";
import { headers } from "next/headers";

// Twilio sends form-encoded POST requests
export async function POST(request: Request) {
  const headersList = await headers();
  const twilioSignature = headersList.get("x-twilio-signature") ?? "";
  const url = request.url;

  // Parse form-encoded body
  const text = await request.text();
  const params = Object.fromEntries(new URLSearchParams(text));

  const from: string = params["From"] ?? "";
  const body: string = params["Body"] ?? "";

  // Validate Twilio signature in production
  if (process.env.NODE_ENV === "production") {
    const valid = validateTwilioSignature(twilioSignature, url, params);
    if (!valid) {
      return new Response(twimlResponse("Invalid request."), {
        status: 403,
        headers: { "Content-Type": "text/xml" },
      });
    }
  }

  if (!isCheckInReply(body)) {
    return new Response(
      twimlResponse("Thanks for your message! To check in, reply HERE when you arrive at your shift."),
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Normalize phone: strip spaces and dashes for lookup
  const normalizedPhone = from.replace(/\s|-/g, "");

  const user = await prisma.user.findFirst({
    where: { phone: { in: [from, normalizedPhone] } },
  });

  if (!user) {
    return new Response(
      twimlResponse("We couldn't find your account. Make sure your phone number is registered in CareCircle."),
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Find their active or upcoming shift
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const shift = await prisma.careShift.findFirst({
    where: {
      primaryCaregiverId: user.id,
      startTime: { lte: twoHoursFromNow },
      endTime: { gte: now },
      status: {
        in: [ShiftStatus.CONFIRMED, ShiftStatus.CLAIMED, ShiftStatus.IN_PROGRESS],
      },
    },
    orderBy: { startTime: "asc" },
  });

  if (!shift) {
    return new Response(
      twimlResponse("We couldn't find an active shift for you right now. Check the app for your schedule."),
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Check for duplicate
  const existing = await prisma.checkIn.findFirst({
    where: { shiftId: shift.id, caregiverId: user.id },
  });

  if (existing) {
    return new Response(
      twimlResponse("You're already checked in for this shift. Thank you! 💚"),
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  const minutesLate = (now.getTime() - shift.startTime.getTime()) / 60000;
  const status = minutesLate > 15 ? CheckInStatus.LATE : CheckInStatus.ON_TIME;

  await prisma.$transaction(async (tx) => {
    await tx.checkIn.create({
      data: {
        shiftId: shift.id,
        caregiverId: user.id,
        method: CheckInMethod.SMS_REPLY,
        status,
        notes: `SMS reply: "${body}"`,
      },
    });

    await tx.careShift.update({
      where: { id: shift.id },
      data: { status: ShiftStatus.IN_PROGRESS },
    });

    await tx.alertEscalation.updateMany({
      where: { shiftId: shift.id, resolvedAt: null },
      data: {
        resolvedAt: now,
        resolvedById: user.id,
        resolution: EscalationResolution.CAREGIVER_ARRIVED,
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SHIFT_CONFIRMATION,
        title: "Checked in via SMS",
        body: "Your SMS check-in was recorded. Have a great shift! 💚",
      },
    });
  });

  const replyMsg =
    status === CheckInStatus.LATE
      ? `Got it, you're checked in! (${Math.round(minutesLate)} min late) Thank you for being there. 💚 — CareCircle`
      : "Got it! You're checked in. Thank you for being there. 💚 — CareCircle";

  return new Response(twimlResponse(replyMsg), {
    headers: { "Content-Type": "text/xml" },
  });
}

function twimlResponse(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

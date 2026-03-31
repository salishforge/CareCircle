import twilio from "twilio";
import { format } from "date-fns";

const client =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export async function sendSms(to: string, body: string): Promise<void> {
  if (!client) {
    console.warn("[Twilio] Client not configured — skipping SMS");
    return;
  }
  if (!process.env.TWILIO_FROM_NUMBER) {
    console.warn("[Twilio] TWILIO_FROM_NUMBER not set — skipping SMS");
    return;
  }
  await client.messages.create({
    from: process.env.TWILIO_FROM_NUMBER,
    to,
    body,
  });
}

interface ShiftReminderParams {
  caregiverName: string;
  caregiverPhone: string;
  shiftStart: Date;
  shiftEnd: Date;
}

export async function sendShiftReminder(params: ShiftReminderParams): Promise<void> {
  const { caregiverName, caregiverPhone, shiftStart, shiftEnd } = params;
  const firstName = caregiverName.split(" ")[0];
  const startStr = format(shiftStart, "h:mm a");
  const endStr = format(shiftEnd, "h:mm a");

  const body =
    `Hi ${firstName}! Your CareCircle shift starts at ${startStr} and ends at ${endStr}. ` +
    `Reply HERE when you arrive. Thank you for being here 💚`;

  await sendSms(caregiverPhone, body);
}

export async function sendEscalationAlert(params: {
  recipientName: string;
  recipientPhone: string;
  missedCaregiverName: string;
  shiftStart: Date;
  level: number;
}): Promise<void> {
  const { recipientName, recipientPhone, missedCaregiverName, shiftStart, level } = params;
  const firstName = recipientName.split(" ")[0];
  const startStr = format(shiftStart, "h:mm a");

  let body: string;
  if (level === 1) {
    body =
      `Hi ${firstName}, ${missedCaregiverName} hasn't checked in for their ${startStr} shift yet. ` +
      `If you can cover, reply YES. CareCircle`;
  } else if (level === 2) {
    body =
      `URGENT: ${missedCaregiverName} is 30+ minutes late for their ${startStr} CareCircle shift. ` +
      `Please check in with them. Reply YES if you can cover.`;
  } else {
    body =
      `ALERT: ${missedCaregiverName} is 45+ minutes late for the ${startStr} shift. ` +
      `The patient may be unattended. Please take action immediately. — CareCircle`;
  }

  await sendSms(recipientPhone, body);
}

/**
 * Validate a Twilio webhook signature.
 * Returns true if the request is legitimately from Twilio.
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!process.env.TWILIO_AUTH_TOKEN) return false;
  return twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params);
}

/** Keywords that count as a check-in reply */
const CHECK_IN_KEYWORDS = ["here", "yes", "arrived", "on my way", "coming", "y", "im here", "i'm here"];

export function isCheckInReply(body: string): boolean {
  const normalized = body.trim().toLowerCase();
  return CHECK_IN_KEYWORDS.some((kw) => normalized.includes(kw));
}

import { Resend } from "resend";
import { format } from "date-fns";
import {
  shiftReminderTemplate,
  escalationTemplate,
  medicationReminderTemplate,
  dailyDigestTemplate,
} from "./email-templates";

const resend =
  process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM = process.env.FROM_EMAIL ?? "CareCircle <care@carecircle.app>";

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!resend) {
    console.warn("[Email] Resend not configured — skipping email");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });
}

export async function sendShiftReminderEmail(params: {
  recipientEmail: string;
  recipientName: string;
  shiftStart: Date;
  shiftEnd: Date;
  circleName: string;
}): Promise<void> {
  const html = shiftReminderTemplate({
    name: params.recipientName.split(" ")[0],
    shiftStart: format(params.shiftStart, "h:mm a"),
    shiftEnd: format(params.shiftEnd, "h:mm a"),
    circleName: params.circleName,
  });

  await sendEmail(
    params.recipientEmail,
    `Shift reminder — ${format(params.shiftStart, "h:mm a")} today`,
    html
  );
}

export async function sendEscalationEmail(params: {
  recipientEmail: string;
  recipientName: string;
  missedCaregiverName: string;
  shiftStart: Date;
  level: number;
}): Promise<void> {
  const labels = { 1: "Check-in overdue", 2: "URGENT: Caregiver late", 3: "EMERGENCY: Patient may be unattended" };
  const subject = labels[params.level as 1 | 2 | 3] ?? "Care alert";

  const html = escalationTemplate({
    name: params.recipientName.split(" ")[0],
    level: params.level,
    caregiverName: params.missedCaregiverName,
    shiftStart: format(params.shiftStart, "h:mm a"),
  });

  await sendEmail(params.recipientEmail, subject, html);
}

export async function sendMedicationReminderEmail(params: {
  recipientEmail: string;
  recipientName: string;
  medications: string[];
}): Promise<void> {
  const html = medicationReminderTemplate({
    name: params.recipientName.split(" ")[0],
    medications: params.medications,
  });

  await sendEmail(
    params.recipientEmail,
    "Medication reminder",
    html
  );
}

export async function sendDailyDigestEmail(params: {
  recipientEmail: string;
  recipientName: string;
  circleName: string;
  date: Date;
  shifts: { caregiver: string; time: string; status: string }[];
  mealsPlanned: number;
  mealsDelivered: number;
  openRequests: number;
  latestMood: number | null;
}): Promise<void> {
  const html = dailyDigestTemplate({
    name: params.recipientName.split(" ")[0],
    circleName: params.circleName,
    date: format(params.date, "EEEE, MMMM d"),
    shifts: params.shifts,
    mealsPlanned: params.mealsPlanned,
    mealsDelivered: params.mealsDelivered,
    openRequests: params.openRequests,
    latestMood: params.latestMood,
  });

  await sendEmail(
    params.recipientEmail,
    `${params.circleName} — Daily Care Summary`,
    html
  );
}

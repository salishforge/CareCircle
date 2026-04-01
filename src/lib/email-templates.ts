/**
 * HTML email templates for CareCircle notifications.
 * All templates use inline styles for maximum email client compatibility.
 */

const SAGE = "#7C9A82";
const AMBER = "#E8A549";
const CORAL = "#D4857B";
const BG = "#FAF8F5";
const TEXT = "#2D2926";
const MUTED = "#6B6560";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BG};font-family:system-ui,-apple-system,sans-serif;color:${TEXT}">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px">
    <div style="text-align:center;padding:16px 0;border-bottom:1px solid #E8E2DC;margin-bottom:24px">
      <span style="font-size:20px;font-weight:700;color:${SAGE};letter-spacing:-0.02em">CareCircle</span>
    </div>
    ${content}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E8E2DC;text-align:center">
      <p style="font-size:12px;color:${MUTED};margin:0">
        You received this because you're part of a CareCircle care team.
        <br>Manage notifications in Settings within the app.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function shiftReminderTemplate(params: {
  name: string;
  shiftStart: string;
  shiftEnd: string;
  circleName: string;
}): string {
  return layout(`
    <h2 style="font-size:18px;margin:0 0 8px">Shift Reminder</h2>
    <p style="color:${MUTED};font-size:14px;margin:0 0 16px">Hi ${params.name},</p>
    <div style="background:white;border-radius:12px;padding:16px;border:1px solid #E8E2DC">
      <p style="font-size:14px;margin:0 0 4px"><strong>Your shift is coming up</strong></p>
      <p style="font-size:14px;color:${MUTED};margin:0">
        ${params.shiftStart} &ndash; ${params.shiftEnd}
      </p>
      <p style="font-size:13px;color:${MUTED};margin:8px 0 0">
        ${params.circleName}
      </p>
    </div>
    <p style="font-size:14px;margin:16px 0 0;color:${MUTED}">
      Remember to check in when you arrive. Reply HERE via SMS or tap the Check In button in the app.
    </p>
  `);
}

export function escalationTemplate(params: {
  name: string;
  level: number;
  caregiverName: string;
  shiftStart: string;
}): string {
  const colors = { 1: AMBER, 2: CORAL, 3: "#CC0000" };
  const color = colors[params.level as 1 | 2 | 3] ?? CORAL;
  const labels = {
    1: "Check-In Overdue",
    2: "URGENT — 30+ Minutes Late",
    3: "EMERGENCY — 45+ Minutes Late",
  };
  const label = labels[params.level as 1 | 2 | 3] ?? "Alert";

  return layout(`
    <div style="background:${color};color:white;padding:12px 16px;border-radius:8px;margin-bottom:16px">
      <p style="font-size:14px;font-weight:700;margin:0">${label}</p>
    </div>
    <p style="font-size:14px;margin:0 0 12px">Hi ${params.name},</p>
    <p style="font-size:14px;margin:0 0 16px">
      <strong>${params.caregiverName}</strong> has not checked in for their shift
      starting at <strong>${params.shiftStart}</strong>.
    </p>
    ${params.level >= 2 ? `<p style="font-size:14px;font-weight:600;color:${color};margin:0">Please take action immediately.</p>` : `<p style="font-size:14px;color:${MUTED};margin:0">If you can cover, please respond in the app or reply HERE via SMS.</p>`}
  `);
}

export function medicationReminderTemplate(params: {
  name: string;
  medications: string[];
}): string {
  const medList = params.medications
    .map((m) => `<li style="padding:4px 0">${m}</li>`)
    .join("");

  return layout(`
    <h2 style="font-size:18px;margin:0 0 8px">Medication Reminder</h2>
    <p style="font-size:14px;margin:0 0 16px;color:${MUTED}">Good morning, ${params.name}!</p>
    <div style="background:white;border-radius:12px;padding:16px;border:1px solid #E8E2DC">
      <p style="font-size:14px;font-weight:600;margin:0 0 8px">Today's medications:</p>
      <ul style="font-size:14px;margin:0;padding-left:20px;color:${TEXT}">
        ${medList}
      </ul>
    </div>
    <p style="font-size:13px;margin:16px 0 0;color:${MUTED}">
      Log your doses in the app to keep your care team informed.
    </p>
  `);
}

export function dailyDigestTemplate(params: {
  name: string;
  circleName: string;
  date: string;
  shifts: { caregiver: string; time: string; status: string }[];
  mealsPlanned: number;
  mealsDelivered: number;
  openRequests: number;
  latestMood: number | null;
}): string {
  const shiftRows = params.shifts
    .map(
      (s) =>
        `<tr>
          <td style="padding:6px 8px;font-size:13px;border-bottom:1px solid #F5F0EB">${s.caregiver}</td>
          <td style="padding:6px 8px;font-size:13px;border-bottom:1px solid #F5F0EB">${s.time}</td>
          <td style="padding:6px 8px;font-size:13px;border-bottom:1px solid #F5F0EB">${s.status}</td>
        </tr>`
    )
    .join("");

  const moodEmoji = params.latestMood
    ? ["", "\u{1F61E}", "\u{1F615}", "\u{1F610}", "\u{1F642}", "\u{1F60A}"][params.latestMood]
    : "N/A";

  return layout(`
    <h2 style="font-size:18px;margin:0 0 4px">Daily Care Summary</h2>
    <p style="font-size:13px;color:${MUTED};margin:0 0 16px">${params.circleName} &mdash; ${params.date}</p>
    <p style="font-size:14px;margin:0 0 16px">Hi ${params.name}, here's today's overview:</p>

    <!-- Stats grid -->
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <div style="flex:1;background:white;border-radius:8px;padding:12px;text-align:center;border:1px solid #E8E2DC">
        <div style="font-size:20px;font-weight:700;color:${SAGE}">${params.mealsDelivered}/${params.mealsPlanned}</div>
        <div style="font-size:11px;color:${MUTED}">Meals</div>
      </div>
      <div style="flex:1;background:white;border-radius:8px;padding:12px;text-align:center;border:1px solid #E8E2DC">
        <div style="font-size:20px;font-weight:700;color:${AMBER}">${params.openRequests}</div>
        <div style="font-size:11px;color:${MUTED}">Open Requests</div>
      </div>
      <div style="flex:1;background:white;border-radius:8px;padding:12px;text-align:center;border:1px solid #E8E2DC">
        <div style="font-size:20px">${moodEmoji}</div>
        <div style="font-size:11px;color:${MUTED}">Mood</div>
      </div>
    </div>

    <!-- Shifts -->
    ${params.shifts.length > 0 ? `
    <h3 style="font-size:14px;margin:0 0 8px">Today's Shifts</h3>
    <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;border:1px solid #E8E2DC">
      <thead>
        <tr style="background:#F5F0EB">
          <th style="padding:6px 8px;font-size:12px;text-align:left;color:${MUTED}">Caregiver</th>
          <th style="padding:6px 8px;font-size:12px;text-align:left;color:${MUTED}">Time</th>
          <th style="padding:6px 8px;font-size:12px;text-align:left;color:${MUTED}">Status</th>
        </tr>
      </thead>
      <tbody>${shiftRows}</tbody>
    </table>
    ` : '<p style="font-size:14px;color:' + MUTED + '">No shifts scheduled today.</p>'}
  `);
}

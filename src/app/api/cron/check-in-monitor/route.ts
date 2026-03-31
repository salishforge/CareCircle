import { checkMissedCheckIns } from "@/lib/escalation-engine";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await checkMissedCheckIns();

  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
    ...summary,
  });
}

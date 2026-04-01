import { checkMissedCheckIns } from "@/lib/escalation-engine";
import { safeCompare } from "@/lib/auth-utils";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && !safeCompare(authHeader, `Bearer ${cronSecret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await checkMissedCheckIns();

  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
    ...summary,
  });
}

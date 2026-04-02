import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const setPinSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
  currentPassword: z.string().min(1),
});

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = setPinSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Verify current password
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) {
    return Response.json({ error: "No password set" }, { status: 400 });
  }

  const passwordValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!passwordValid) {
    return Response.json({ error: "Incorrect password" }, { status: 403 });
  }

  // Hash and store PIN
  try {
    const pinHash = await bcrypt.hash(parsed.data.pin, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { kioskPin: pinHash },
    });
    return Response.json({ success: true });
  } catch (err) {
    console.error("PIN save error:", err);
    return Response.json(
      { error: "Failed to save PIN. The database may need a migration: npx prisma migrate dev" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { kioskPin: null },
  });

  return Response.json({ success: true });
}

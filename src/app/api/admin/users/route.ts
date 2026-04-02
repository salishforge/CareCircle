import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

async function requireAdmin(userId: string): Promise<Response | null> {
  const membership = await prisma.careCircleMember.findFirst({
    where: {
      userId,
      isActive: true,
      role: { in: ["ADMIN", "PRIMARY_CAREGIVER"] },
    },
  });
  if (!membership) {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminError = await requireAdmin(session.user.id);
  if (adminError) return adminError;

  // Get the circle
  const membership = await prisma.careCircleMember.findFirst({
    where: { userId: session.user.id, isActive: true },
  });

  if (!membership) {
    return Response.json({ error: "No circle found" }, { status: 404 });
  }

  const members = await prisma.careCircleMember.findMany({
    where: { careCircleId: membership.careCircleId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          isLocked: true,
          createdAt: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return Response.json(
    members.map((m) => ({
      memberId: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone,
      image: m.user.image,
      userRole: m.user.role,
      circleRole: m.role,
      isActive: m.isActive,
      isLocked: m.user.isLocked,
      joinedAt: m.joinedAt,
      createdAt: m.user.createdAt,
    }))
  );
}

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(["PATIENT", "PRIMARY_CAREGIVER", "CAREGIVER", "MEAL_PROVIDER", "ADMIN"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminError = await requireAdmin(session.user.id);
  if (adminError) return adminError;

  const body = await request.json().catch(() => ({}));
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, name, password, phone, role } = parsed.data;

  // Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already in use" }, { status: 409 });
  }

  const membership = await prisma.careCircleMember.findFirst({
    where: { userId: session.user.id, isActive: true },
  });

  if (!membership) {
    return Response.json({ error: "No circle found" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      phone: phone || null,
      role: role === "ADMIN" ? "PRIMARY_CAREGIVER" : role,
      authProvider: "LOCAL",
    },
  });

  await prisma.careCircleMember.create({
    data: {
      careCircleId: membership.careCircleId,
      userId: user.id,
      role,
    },
  });

  return Response.json({ id: user.id, email, name, role }, { status: 201 });
}

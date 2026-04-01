import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCircleMembership } from "@/lib/auth-utils";
import { z } from "zod";

const createListSchema = z.object({
  careCircleId: z.string(),
  title: z.string().min(1),
  category: z.enum(["FOOD", "MEDICAL", "HOME", "PERSONAL"]).default("FOOD"),
});

const addItemSchema = z.object({
  listId: z.string(),
  name: z.string().min(1),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  estimatedCost: z.number().optional(),
});

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

  const membershipError = await requireCircleMembership(session.user.id, careCircleId);
  if (membershipError) return membershipError;

  const lists = await prisma.shoppingList.findMany({
    where: { careCircleId, status: "ACTIVE" },
    include: {
      items: {
        include: {
          assignedTo: { select: { id: true, name: true, image: true } },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(lists);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  // Creating an item vs. creating a list
  if (body.listId) {
    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const item = await prisma.shoppingItem.create({
      data: {
        listId: parsed.data.listId,
        name: parsed.data.name,
        quantity: parsed.data.quantity ?? null,
        unit: parsed.data.unit ?? null,
        notes: parsed.data.notes ?? null,
        priority: parsed.data.priority,
        estimatedCost: parsed.data.estimatedCost ?? null,
        status: "NEEDED",
      },
      include: {
        assignedTo: { select: { id: true, name: true, image: true } },
      },
    });

    return Response.json(item, { status: 201 });
  }

  const parsed = createListSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const membershipError2 = await requireCircleMembership(session.user.id, parsed.data.careCircleId);
  if (membershipError2) return membershipError2;

  const list = await prisma.shoppingList.create({
    data: {
      careCircleId: parsed.data.careCircleId,
      title: parsed.data.title,
      category: parsed.data.category,
      createdById: session.user.id,
      status: "ACTIVE",
    },
    include: {
      items: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  return Response.json(list, { status: 201 });
}

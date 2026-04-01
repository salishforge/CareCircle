import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const documentSchema = z.object({
  careCircleId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
  category: z.string().default("general"),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const careCircleId = searchParams.get("careCircleId");
  const category = searchParams.get("category");

  if (!careCircleId) {
    return Response.json({ error: "careCircleId required" }, { status: 400 });
  }

  const documents = await prisma.document.findMany({
    where: {
      careCircleId,
      ...(category ? { category } : {}),
    },
    include: {
      uploadedBy: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(documents);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = documentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      careCircleId: parsed.data.careCircleId,
      uploadedById: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      fileUrl: parsed.data.fileUrl,
      fileType: parsed.data.fileType,
      fileSize: parsed.data.fileSize,
      category: parsed.data.category,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, image: true } },
    },
  });

  return Response.json(document, { status: 201 });
}

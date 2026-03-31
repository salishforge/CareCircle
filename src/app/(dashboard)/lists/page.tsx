import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShoppingListView } from "@/components/shopping/ShoppingListView";
import { getActiveCareCircle } from "@/lib/queries/dashboard";

export default async function ListsPage() {
  const session = await auth();
  const membership = session?.user?.id
    ? await getActiveCareCircle(session.user.id)
    : null;

  const lists = membership?.careCircleId
    ? await prisma.shoppingList.findMany({
        where: { careCircleId: membership.careCircleId, status: "ACTIVE" },
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
      })
    : [];

  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Shopping Lists</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Food, supplies, and everything in between
        </p>
      </div>

      <ShoppingListView
        lists={lists}
        careCircleId={membership?.careCircleId ?? ""}
        currentUserId={session?.user?.id ?? ""}
      />
    </div>
  );
}

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
const mockPrisma = {
  notification: {
    findMany: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

// Mock auth
const mockSession = { user: { id: "user-1", name: "Test User" } };
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

// Import after mocks
const { GET, PATCH } = await import("@/app/api/notifications/route");

describe("GET /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns notifications and unread count", async () => {
    const mockNotifications = [
      { id: "n1", type: "SYSTEM", title: "Test", body: "Hello", read: false, createdAt: new Date() },
    ];
    mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
    mockPrisma.notification.count.mockResolvedValue(1);

    const req = new Request("http://localhost/api/notifications?limit=10");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.notifications).toHaveLength(1);
    expect(data.unreadCount).toBe(1);
  });

  it("filters unread only", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.notification.count.mockResolvedValue(0);

    const req = new Request("http://localhost/api/notifications?unread=true");
    await GET(req);

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ read: false }),
      })
    );
  });
});

describe("PATCH /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks all notifications as read", async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

    const req = new Request("http://localhost/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    const res = await PATCH(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", read: false },
      })
    );
  });

  it("marks specific notifications as read", async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 2 });

    const req = new Request("http://localhost/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["n1", "n2"] }),
    });
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ["n1", "n2"] },
        }),
      })
    );
  });
});

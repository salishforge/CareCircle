import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  patientRequest: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  careCircleMember: {
    findFirst: vi.fn(() => Promise.resolve({ id: "m1", role: "CAREGIVER" })),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const mockSession = { user: { id: "user-1" } };
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

const { GET, POST } = await import("@/app/api/requests/route");

describe("GET /api/requests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires careCircleId", async () => {
    const req = new Request("http://localhost/api/requests");
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it("returns requests for care circle", async () => {
    mockPrisma.patientRequest.findMany.mockResolvedValue([
      { id: "r1", type: "MEAL", description: "Lunch please", priority: "NORMAL", status: "OPEN" },
    ]);

    const req = new Request("http://localhost/api/requests?careCircleId=cc1");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("filters by status", async () => {
    mockPrisma.patientRequest.findMany.mockResolvedValue([]);

    const req = new Request("http://localhost/api/requests?careCircleId=cc1&status=OPEN");
    await GET(req);

    expect(mockPrisma.patientRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "OPEN" }),
      })
    );
  });
});

describe("POST /api/requests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a request with valid data", async () => {
    const mockReq = {
      id: "r1", type: "MEAL", description: "Lunch", priority: "NORMAL", status: "OPEN",
      patient: { id: "user-1", name: "Test", image: null },
      assignedTo: null,
    };
    mockPrisma.patientRequest.create.mockResolvedValue(mockReq);

    const req = new Request("http://localhost/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        careCircleId: "cc1",
        type: "MEAL",
        description: "Need lunch delivered",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it("rejects invalid request type", async () => {
    const req = new Request("http://localhost/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        careCircleId: "cc1",
        type: "INVALID",
        description: "Test",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

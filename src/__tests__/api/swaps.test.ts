import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  careShift: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  shiftSwapRequest: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const mockSession = { user: { id: "user-1", name: "Test User" } };
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

const { POST } = await import("@/app/api/shifts/[id]/swap/route");

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/shifts/[id]/swap", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when shift not found", async () => {
    mockPrisma.careShift.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/shifts/shift-1/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Sick" }),
    });

    const res = await POST(req, makeParams("shift-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not the assigned caregiver", async () => {
    mockPrisma.careShift.findUnique.mockResolvedValue({
      id: "shift-1",
      primaryCaregiverId: "other-user",
      primaryCaregiver: { name: "Other" },
      careCircle: { members: [] },
    });

    const req = new Request("http://localhost/api/shifts/shift-1/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req, makeParams("shift-1"));
    expect(res.status).toBe(403);
  });

  it("returns 409 when a pending swap already exists", async () => {
    mockPrisma.careShift.findUnique.mockResolvedValue({
      id: "shift-1",
      primaryCaregiverId: "user-1",
      primaryCaregiver: { name: "Test" },
      careCircle: { members: [] },
    });
    mockPrisma.shiftSwapRequest.findFirst.mockResolvedValue({ id: "existing-swap" });

    const req = new Request("http://localhost/api/shifts/shift-1/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Sick" }),
    });

    const res = await POST(req, makeParams("shift-1"));
    expect(res.status).toBe(409);
  });

  it("creates swap request successfully", async () => {
    mockPrisma.careShift.findUnique.mockResolvedValue({
      id: "shift-1",
      primaryCaregiverId: "user-1",
      primaryCaregiver: { name: "Test" },
      careCircle: { members: [] },
    });
    mockPrisma.shiftSwapRequest.findFirst.mockResolvedValue(null);
    mockPrisma.shiftSwapRequest.create.mockResolvedValue({
      id: "swap-1",
      originalShiftId: "shift-1",
      requesterId: "user-1",
      reason: "Doctor appointment",
      status: "PENDING",
      requester: { id: "user-1", name: "Test" },
      originalShift: { startTime: new Date(), endTime: new Date(), date: new Date() },
    });

    const req = new Request("http://localhost/api/shifts/shift-1/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Doctor appointment" }),
    });

    const res = await POST(req, makeParams("shift-1"));
    expect(res.status).toBe(201);
  });
});

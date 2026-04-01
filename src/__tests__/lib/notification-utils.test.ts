import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationType } from "@/generated/prisma/client";

// We need to test the pure functions without DB calls
// Import the functions after mocking

const mockPrisma = {
  user: { findUnique: vi.fn() },
  notification: { create: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/web-push", () => ({
  sendPushToUser: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(() => Promise.resolve()),
}));

const { isInQuietHours, shouldNotifyChannel, getUserPrefs } = await import(
  "@/lib/notification-utils"
);

describe("isInQuietHours", () => {
  it("returns false when no quiet hours configured", () => {
    const prefs = {
      email: true,
      sms: true,
      push: true,
      quietHoursStart: null,
      quietHoursEnd: null,
    };
    expect(isInQuietHours(prefs)).toBe(false);
  });

  it("detects overnight quiet hours (22:00 - 07:00)", () => {
    const prefs = {
      email: true,
      sms: true,
      push: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
    };

    // 23:00 — should be quiet
    const lateNight = new Date("2026-04-01T23:00:00");
    expect(isInQuietHours(prefs, lateNight)).toBe(true);

    // 03:00 — should be quiet
    const earlyMorning = new Date("2026-04-01T03:00:00");
    expect(isInQuietHours(prefs, earlyMorning)).toBe(true);

    // 08:00 — should NOT be quiet
    const morning = new Date("2026-04-01T08:00:00");
    expect(isInQuietHours(prefs, morning)).toBe(false);

    // 14:00 — should NOT be quiet
    const afternoon = new Date("2026-04-01T14:00:00");
    expect(isInQuietHours(prefs, afternoon)).toBe(false);
  });

  it("detects same-day quiet hours (09:00 - 17:00)", () => {
    const prefs = {
      email: true,
      sms: true,
      push: true,
      quietHoursStart: "09:00",
      quietHoursEnd: "17:00",
    };

    // 12:00 — should be quiet
    const noon = new Date("2026-04-01T12:00:00");
    expect(isInQuietHours(prefs, noon)).toBe(true);

    // 08:00 — should NOT be quiet
    const before = new Date("2026-04-01T08:00:00");
    expect(isInQuietHours(prefs, before)).toBe(false);

    // 18:00 — should NOT be quiet
    const after = new Date("2026-04-01T18:00:00");
    expect(isInQuietHours(prefs, after)).toBe(false);
  });
});

describe("shouldNotifyChannel", () => {
  const basePrefs = {
    email: true,
    sms: true,
    push: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  };

  it("returns false when channel is disabled", () => {
    const prefs = { ...basePrefs, email: false };
    const daytime = new Date("2026-04-01T14:00:00");
    expect(shouldNotifyChannel(prefs, "email", NotificationType.SYSTEM, daytime)).toBe(false);
  });

  it("returns true for enabled channel during daytime", () => {
    const daytime = new Date("2026-04-01T14:00:00");
    expect(shouldNotifyChannel(basePrefs, "push", NotificationType.SHIFT_REMINDER, daytime)).toBe(true);
  });

  it("returns false during quiet hours for normal notifications", () => {
    const nightTime = new Date("2026-04-01T23:30:00");
    expect(shouldNotifyChannel(basePrefs, "push", NotificationType.SHIFT_REMINDER, nightTime)).toBe(false);
  });

  it("ESCALATIONS bypass quiet hours", () => {
    const nightTime = new Date("2026-04-01T23:30:00");
    expect(shouldNotifyChannel(basePrefs, "push", NotificationType.ESCALATION, nightTime)).toBe(true);
    expect(shouldNotifyChannel(basePrefs, "email", NotificationType.ESCALATION, nightTime)).toBe(true);
    expect(shouldNotifyChannel(basePrefs, "sms", NotificationType.ESCALATION, nightTime)).toBe(true);
  });

  it("ESCALATIONS still respect disabled channels", () => {
    const prefs = { ...basePrefs, email: false };
    const nightTime = new Date("2026-04-01T23:30:00");
    expect(shouldNotifyChannel(prefs, "email", NotificationType.ESCALATION, nightTime)).toBe(false);
  });
});

describe("getUserPrefs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns defaults when user has no preferences", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ notificationPreferences: null });

    const prefs = await getUserPrefs("user-1");
    expect(prefs.email).toBe(true);
    expect(prefs.sms).toBe(true);
    expect(prefs.push).toBe(true);
    expect(prefs.quietHoursStart).toBeNull();
  });

  it("returns stored preferences", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      notificationPreferences: {
        email: false,
        sms: true,
        push: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "06:00",
      },
    });

    const prefs = await getUserPrefs("user-1");
    expect(prefs.email).toBe(false);
    expect(prefs.quietHoursStart).toBe("22:00");
  });
});

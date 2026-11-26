import { asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { ledgerEvents } from "../drizzle/schema";
import { getDb } from "./db";
import { evaluateOmegaGate } from "./omega-gate";
import { executeReplayPipeline } from "./replay-engine";

describe.skipIf(!process.env.DATABASE_URL)("Replay MySQL integration", () => {
  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is required for replay integration tests");
    await db.delete(ledgerEvents);
  });

  it("replays a PASS and BLOCK event without writing new ledger rows", async () => {
    await evaluateOmegaGate({ psi: 0.95, theta: 50, cvar: 0.02, pole: 1 });
    await evaluateOmegaGate({ psi: 0.5, theta: 200, cvar: 0.5, pole: 0 });

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const before = await db.select({ id: ledgerEvents.id }).from(ledgerEvents).orderBy(asc(ledgerEvents.id));
    expect(before).toHaveLength(2);

    const result = await executeReplayPipeline({ verifyIntegrity: true });
    expect(result.success).toBe(true);
    expect(result.integrityVerified).toBe(true);
    expect(result.integrityStatus).toBe("VERIFIED");
    expect(result.states).toHaveLength(2);
    expect(result.states.map((state) => state.gatePassed)).toEqual([true, false]);
    expect(result.anchorStatus).toBe("NOT_SUBMITTED");

    const range = await executeReplayPipeline({
      startEventId: before[1].id,
      endEventId: before[1].id,
      verifyIntegrity: true,
    });
    expect(range.success).toBe(true);
    expect(range.integrityVerified).toBe(true);
    expect(range.states.map((state) => state.eventId)).toEqual([before[1].id]);

    const after = await db.select({ id: ledgerEvents.id }).from(ledgerEvents).orderBy(asc(ledgerEvents.id));
    expect(after).toHaveLength(before.length);
  });

  it("rejects a v2 event when its persisted payload is changed", async () => {
    await evaluateOmegaGate({ psi: 0.95, theta: 50, cvar: 0.02, pole: 1 });

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const rows = await db.select({ id: ledgerEvents.id }).from(ledgerEvents).orderBy(asc(ledgerEvents.id));
    await db
      .update(ledgerEvents)
      .set({ hashPayload: '{"tampered":true}' })
      .where(eq(ledgerEvents.id, rows[0].id));

    const result = await executeReplayPipeline({ verifyIntegrity: true });
    expect(result.success).toBe(false);
    expect(result.integrityVerified).toBe(false);
    expect(result.integrityStatus).toBe("INVALID");
    expect(result.message).toContain("Event hash/payload mismatch");
  });
});

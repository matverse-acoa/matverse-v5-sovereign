import { describe, expect, it } from "vitest";
import {
  hashLedgerEvent,
  serializeLedgerEventPayload,
  LedgerEventHashPayload,
} from "./crypto";
import {
  evaluateReplayDecision,
  ReplayState,
  verifyReplayEventHash,
} from "./replay-engine";

function makeState(): ReplayState {
  const payload: LedgerEventHashPayload = {
    cvar: 20,
    decision: "PASS",
    nonce: "test-nonce-0001",
    omega: 900,
    pole: 1,
    prevHash: "0".repeat(64),
    psi: 950,
    theta: 50,
    timestamp: 1795651200000,
  };
  const hashPayload = serializeLedgerEventPayload(payload);
  return {
    eventId: 1,
    hash: hashLedgerEvent(payload),
    prevHash: payload.prevHash,
    hashVersion: 2,
    hashPayload,
    metrics: { psi: 0.95, theta: 50, cvar: 0.02, pole: 1 },
    decision: { omega: 0.9, decision: "PASS" },
    merkleRoot: "",
    timestamp: new Date(payload.timestamp),
  };
}

describe("Replay event integrity", () => {
  it("recomputes a canonical v2 event hash", () => {
    expect(verifyReplayEventHash(makeState())).toBe("VALID");
  });

  it("detects changes to persisted metrics", () => {
    const state = makeState();
    const tampered: ReplayState = { ...state, metrics: { ...state.metrics, psi: 0.5 } };
    expect(verifyReplayEventHash(tampered)).toBe("INVALID");
  });

  it("does not mislabel legacy events as verified or corrupted", () => {
    const state = makeState();
    const legacy: ReplayState = { ...state, hashVersion: 1, hashPayload: null };
    expect(verifyReplayEventHash(legacy)).toBe("UNVERIFIABLE_LEGACY");
  });
});

describe("Pure replay evaluation", () => {
  it("re-evaluates decisions without a ledger write path", () => {
    const pass = evaluateReplayDecision({ psi: 0.95, theta: 50, cvar: 0.02, pole: 1 });
    const block = evaluateReplayDecision({ psi: 0.5, theta: 200, cvar: 0.5, pole: 0 });
    expect(pass.decision).toBe("PASS");
    expect(pass.omega).toBeGreaterThanOrEqual(0.85);
    expect(block.decision).toBe("BLOCK");
    expect(block.omega).toBeLessThan(0.85);
  });
});

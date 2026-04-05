import { describe, it, expect } from "vitest";
import { computeOmega, OmegaMetrics } from "./omega-gate";
import { computeMerkleRoot, sha256, verifyMerkleProof, getMerkleProofPath } from "./crypto";

describe("Omega Gate V5", () => {
  it("computes Omega correctly with all metrics at baseline", () => {
    const metrics: OmegaMetrics = {
      psi: 0.95,
      theta: 50,
      cvar: 0.02,
      pole: 1,
    };
    const omega = computeOmega(metrics);
    expect(omega).toBeGreaterThan(0.85);
    expect(omega).toBeLessThanOrEqual(1.0);
  });

  it("applies PoLE penalty when pole is 0", () => {
    const metricsWithPole: OmegaMetrics = {
      psi: 0.95,
      theta: 50,
      cvar: 0.02,
      pole: 1,
    };
    const metricsWithoutPole: OmegaMetrics = {
      psi: 0.95,
      theta: 50,
      cvar: 0.02,
      pole: 0,
    };

    const omegaWith = computeOmega(metricsWithPole);
    const omegaWithout = computeOmega(metricsWithoutPole);

    expect(omegaWithout).toBeLessThan(omegaWith);
    expect(omegaWithout).toBeLessThanOrEqual(omegaWith * 0.9);
  });

  it("returns BLOCK decision when omega < 0.85", () => {
    const metrics: OmegaMetrics = {
      psi: 0.5,
      theta: 200,
      cvar: 0.5,
      pole: 0,
    };
    const omega = computeOmega(metrics);
    expect(omega).toBeLessThan(0.85);
  });
});

describe("Merkle Tree", () => {
  it("computes merkle root correctly", () => {
    const hashes = [
      sha256("event1"),
      sha256("event2"),
      sha256("event3"),
      sha256("event4"),
    ];
    const root = computeMerkleRoot(hashes);
    expect(root).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(root)).toBe(true);
  });

  it("produces consistent merkle root for same input", () => {
    const hashes = [sha256("a"), sha256("b"), sha256("c")];
    const root1 = computeMerkleRoot(hashes);
    const root2 = computeMerkleRoot(hashes);
    expect(root1).toBe(root2);
  });

  it("generates and verifies merkle proof correctly", () => {
    const hashes = [
      sha256("event1"),
      sha256("event2"),
      sha256("event3"),
      sha256("event4"),
    ];
    const root = computeMerkleRoot(hashes);
    const proof = getMerkleProofPath(hashes, 0);
    const isValid = verifyMerkleProof(hashes[0], proof, root);
    expect(isValid).toBe(true);
  });

  it("rejects invalid merkle proof", () => {
    const hashes = [
      sha256("event1"),
      sha256("event2"),
      sha256("event3"),
      sha256("event4"),
    ];
    const root = computeMerkleRoot(hashes);
    const proof = getMerkleProofPath(hashes, 0);
    const isValid = verifyMerkleProof(sha256("fake"), proof, root);
    expect(isValid).toBe(false);
  });
});

describe("SHA256 Hash", () => {
  it("produces consistent hash for same input", () => {
    const data = "test data";
    const hash1 = sha256(data);
    const hash2 = sha256(data);
    expect(hash1).toBe(hash2);
  });

  it("produces different hash for different input", () => {
    const hash1 = sha256("data1");
    const hash2 = sha256("data2");
    expect(hash1).not.toBe(hash2);
  });

  it("produces 64-character hex string", () => {
    const hash = sha256("test");
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
  });
});

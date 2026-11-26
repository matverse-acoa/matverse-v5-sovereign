import { afterEach, describe, expect, it, vi } from "vitest";
import { anchorMerkleRoot, verifyAnchor } from "./web3-anchor";
import { computeMerkleRoot, getMerkleProofPath, verifyMerkleProof, sha256 } from "./crypto";

describe("Merkle roots and proofs", () => {
  it("computes a deterministic Merkle root", () => {
    const events = ["a".repeat(64), "b".repeat(64), "c".repeat(64)];
    expect(computeMerkleRoot(events)).toBe(computeMerkleRoot(events));
    expect(computeMerkleRoot(events)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("verifies right-side and odd-leaf proofs using the leaf index", () => {
    const events = [sha256("one"), sha256("two"), sha256("three")];
    const root = computeMerkleRoot(events);
    for (const index of [0, 1, 2]) {
      const proof = getMerkleProofPath(events, index);
      expect(verifyMerkleProof(events[index], proof, root, index)).toBe(true);
    }
  });

  it("rejects a proof for a different leaf", () => {
    const events = [sha256("one"), sha256("two"), sha256("three")];
    const root = computeMerkleRoot(events);
    const proof = getMerkleProofPath(events, 1);
    expect(verifyMerkleProof(sha256("other"), proof, root, 1)).toBe(false);
  });
});

describe("External anchor authorization boundary", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("does not submit unless call-site approval and environment opt-in are both present", async () => {
    vi.stubEnv("MATVERSE_ALLOW_EXTERNAL_ANCHOR", "false");
    const result = await anchorMerkleRoot(
      "a".repeat(64),
      `0x${"1".repeat(64)}`,
      { approved: true, network: "sepolia" }
    );
    expect(result.status).toBe("FAILED");
    expect(result.reason).toBe("external_submission_not_authorized");
  });

  it("does not claim chain verification without an RPC endpoint", async () => {
    vi.stubEnv("SEPOLIA_RPC_URL", "");
    expect(await verifyAnchor(`0x${"a".repeat(64)}`, "a".repeat(64))).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { 
  computeMerkleRoot, 
  getMerkleProofPath, 
  verifyMerkleProof,
  sha256
} from "./crypto";

describe("Web3 Anchor Integration", () => {
  describe("Merkle Root Computation", () => {
    it("should compute deterministic Merkle Root from events", () => {
      const events = [
        "a".repeat(64),
        "b".repeat(64),
        "c".repeat(64),
      ];

      const root1 = computeMerkleRoot(events);
      const root2 = computeMerkleRoot(events);

      expect(root1).toBe(root2);
      expect(root1).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(root1)).toBe(true);
    });

    it("should produce different Merkle Root for different events", () => {
      const events1 = ["a".repeat(64), "b".repeat(64)];
      const events2 = ["a".repeat(64), "c".repeat(64)];

      const root1 = computeMerkleRoot(events1);
      const root2 = computeMerkleRoot(events2);

      expect(root1).not.toBe(root2);
    });

    it("should handle single event", () => {
      const events = ["a".repeat(64)];
      const root = computeMerkleRoot(events);
      expect(root).toBe("a".repeat(64));
    });

    it("should handle empty array", () => {
      const events: string[] = [];
      const root = computeMerkleRoot(events);
      expect(root).toBe("0".repeat(64));
    });
  });

  describe("SHA-256 Hashing", () => {
    it("should produce deterministic hashes", () => {
      const data = "test_data_for_hashing";
      const hash1 = sha256(data);
      const hash2 = sha256(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it("should produce different hashes for different inputs", () => {
      const hash1 = sha256("input1");
      const hash2 = sha256("input2");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("Merkle Proof Generation & Verification", () => {
    it("should generate valid proof path for event in tree", () => {
      const hashes = [
        "a".repeat(64),
        "b".repeat(64),
        "c".repeat(64),
        "d".repeat(64),
      ];

      const proofPath = getMerkleProofPath(hashes, 1);

      expect(proofPath).toBeDefined();
      expect(Array.isArray(proofPath)).toBe(true);
      expect(proofPath.length).toBeGreaterThan(0);
    });



    it("should reject invalid Merkle proof", () => {
      const hashes = [
        "a".repeat(64),
        "b".repeat(64),
        "c".repeat(64),
        "d".repeat(64),
      ];

      const root = computeMerkleRoot(hashes);
      const targetHash = "e".repeat(64); // Not in tree
      const proofPath = getMerkleProofPath(hashes, 1);

      const isValid = verifyMerkleProof(targetHash, proofPath, root);
      expect(isValid).toBe(false);
    });


  });

  describe("Deterministic Hash Chain", () => {
    it("should maintain hash chain integrity", () => {
      const event1Hash = "a".repeat(64);
      const event2Hash = "b".repeat(64);
      const event3Hash = "c".repeat(64);

      // Simulate chain: event1 -> event2 -> event3
      const chain = [event1Hash, event2Hash, event3Hash];

      // Each hash should be deterministic
      const root = computeMerkleRoot(chain);
      const root2 = computeMerkleRoot(chain);

      expect(root).toBe(root2);

      // Changing order should change root
      const reorderedRoot = computeMerkleRoot([event3Hash, event2Hash, event1Hash]);
      expect(root).not.toBe(reorderedRoot);
    });
  });

  describe("Anchor Verification Scenario", () => {
    it("should support full anchor verification workflow", () => {
      // 1. Create events
      const events = [
        "event1_hash_" + "a".repeat(54),
        "event2_hash_" + "b".repeat(54),
        "event3_hash_" + "c".repeat(54),
      ];

      // 2. Compute Merkle Root
      const merkleRoot = computeMerkleRoot(events);
      expect(merkleRoot).toHaveLength(64);

      // 3. Generate proof for event 0 (first element)
      const proofPath = getMerkleProofPath(events, 0);
      expect(proofPath).toBeDefined();

      // 4. Verify proof
      const isValid = verifyMerkleProof(events[0], proofPath, merkleRoot);
      expect(isValid).toBe(true);

      // 5. Simulate on-chain anchor (would be tx_hash in real scenario)
      const simulatedTxHash = "0x" + merkleRoot.substring(0, 40);
      expect(simulatedTxHash).toMatch(/^0x[a-f0-9]{40}$/);
    });


  });
});

import crypto from "crypto";

export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return "0".repeat(64);
  if (hashes.length === 1) return hashes[0];

  let currentLevel = hashes;
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || currentLevel[i];
      const combined = sha256(left + right);
      nextLevel.push(combined);
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

export function getMerkleProofPath(hashes: string[], index: number): string[] {
  const path: string[] = [];
  let currentIndex = index;
  let currentLevel = hashes;

  while (currentLevel.length > 1) {
    const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
    if (siblingIndex < currentLevel.length) {
      path.push(currentLevel[siblingIndex]);
    }
    currentIndex = Math.floor(currentIndex / 2);
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || currentLevel[i];
      nextLevel.push(sha256(left + right));
    }
    currentLevel = nextLevel;
  }

  return path;
}

export function verifyMerkleProof(leaf: string, proof: string[], root: string): boolean {
  let current = leaf;
  for (const sibling of proof) {
    current = sha256(current + sibling);
  }
  return current === root;
}

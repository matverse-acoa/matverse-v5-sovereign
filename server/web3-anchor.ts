import { ethers } from "ethers";

const SEPOLIA_RPC = "https://sepolia.infura.io/v3/YOUR_INFURA_KEY";
const SEPOLIA_CHAIN_ID = 11155111;

interface AnchorResult {
  txHash: string;
  blockNumber?: number;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  timestamp: number;
}

export async function anchorMerkleRoot(
  merkleRoot: string,
  privateKey: string
): Promise<AnchorResult> {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0,
      data: ethers.toBeHex(merkleRoot),
      gasLimit: 21000,
    });

    return {
      txHash: tx.hash,
      status: "PENDING",
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("[Web3] Failed to anchor merkle root:", error);
    return {
      txHash: "",
      status: "FAILED",
      timestamp: Date.now(),
    };
  }
}

export async function verifyAnchor(txHash: string): Promise<AnchorResult | null> {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return {
        txHash,
        status: "PENDING",
        timestamp: Date.now(),
      };
    }

    return {
      txHash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? "CONFIRMED" : "FAILED",
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("[Web3] Failed to verify anchor:", error);
    return null;
  }
}

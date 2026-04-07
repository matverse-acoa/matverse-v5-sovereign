import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AnchorRecord {
  id: number;
  merkleRoot: string;
  txHash: string;
  blockNumber: number | null;
  status: "pending" | "confirmed" | "failed";
  createdAt: Date;
  confirmedAt: Date | null;
}

export default function Anchors() {
  const [anchors, setAnchors] = useState<AnchorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnchors = async () => {
      try {
        setLoading(true);
        // Simular dados de ancoragens
        const mockAnchors: AnchorRecord[] = [
          {
            id: 1,
            merkleRoot: "b91d6c6ff71cf4a0357c1ae429b5cc189dcb4b32667ddbe1b34c6b9655e37566",
            txHash: "0x50b78a12c10fa9475ab6eb62ca1ae0238f5ebc05afb5886e1aa2bad16d54f9c1",
            blockNumber: 5432101,
            status: "confirmed",
            createdAt: new Date("2026-04-07T09:00:00Z"),
            confirmedAt: new Date("2026-04-07T09:15:00Z"),
          },
          {
            id: 2,
            merkleRoot: "c82e7d7gg82dg5b1468d2bf530d6dd290edce5c43778eef2c45d7c766f48477",
            txHash: "0x61c89b23d21gb586bc7fc73db2bf1349f6fcd16b6bg9997f2bb3cbe27e65g0d2",
            blockNumber: null,
            status: "pending",
            createdAt: new Date("2026-04-07T10:30:00Z"),
            confirmedAt: null,
          },
        ];
        setAnchors(mockAnchors);
      } catch (error) {
        console.error("Erro ao carregar ancoragens:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnchors();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "failed":
        return <Badge className="bg-red-500">Falhou</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Ancoragens On-Chain</h1>
        <p className="text-muted-foreground mt-2">
          Visualize o status de todos os Merkle Roots ancorados na blockchain Sepolia
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {anchors.map((anchor) => (
            <Card key={anchor.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(anchor.status)}
                    <div>
                      <CardTitle className="text-lg">
                        Merkle Root #{anchor.id}
                      </CardTitle>
                      <CardDescription>
                        Criado em {new Date(anchor.createdAt).toLocaleString("pt-BR")}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(anchor.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Merkle Root
                    </label>
                    <p className="font-mono text-sm break-all">
                      {anchor.merkleRoot}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Transaction Hash
                    </label>
                    <p className="font-mono text-sm break-all">
                      {anchor.txHash}
                    </p>
                  </div>
                </div>

                {anchor.blockNumber && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Bloco
                      </label>
                      <p className="font-mono text-sm">{anchor.blockNumber}</p>
                    </div>
                    {anchor.confirmedAt && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Confirmado em
                        </label>
                        <p className="text-sm">
                          {new Date(anchor.confirmedAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${anchor.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Ver no Etherscan →
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

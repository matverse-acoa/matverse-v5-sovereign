import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface VerificationResult {
  merkleRoot: string;
  isValid: boolean;
  eventCount: number;
  hashChainValid: boolean;
  onChainConfirmed: boolean;
  lastVerified: Date;
}

export default function Audit() {
  const [merkleRoot, setMerkleRoot] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!merkleRoot.trim()) {
      setError("Por favor, insira um Merkle Root válido");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Simular verificação de integridade
      const mockResult: VerificationResult = {
        merkleRoot: merkleRoot,
        isValid: merkleRoot.length === 64,
        eventCount: 42,
        hashChainValid: true,
        onChainConfirmed: true,
        lastVerified: new Date(),
      };

      setResult(mockResult);
    } catch (err) {
      setError("Erro ao verificar integridade criptográfica");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Auditoria & Verificação</h1>
        <p className="text-muted-foreground mt-2">
          Verifique a integridade criptográfica de qualquer Merkle Root
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verificar Integridade</CardTitle>
          <CardDescription>
            Insira um Merkle Root para validar sua integridade e status on-chain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Merkle Root (64 caracteres hexadecimais)"
              value={merkleRoot}
              onChange={(e) => setMerkleRoot(e.target.value)}
              disabled={loading}
              className="font-mono"
            />
            <Button
              onClick={handleVerify}
              disabled={loading}
              className="whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar"
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resultado da Verificação</CardTitle>
                {result.isValid ? (
                  <Badge className="bg-green-500">Válido</Badge>
                ) : (
                  <Badge className="bg-red-500">Inválido</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Merkle Root
                  </label>
                  <p className="font-mono text-sm break-all">{result.merkleRoot}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Número de Eventos
                  </label>
                  <p className="text-lg font-semibold">{result.eventCount}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cadeia de Hash Válida</span>
                  <div className="flex items-center gap-2">
                    {result.hashChainValid ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-600">Válida</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-red-600">Inválida</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confirmado On-Chain</span>
                  <div className="flex items-center gap-2">
                    {result.onChainConfirmed ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-600">Confirmado</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm text-yellow-600">Pendente</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Verificação</span>
                  <span className="text-sm">
                    {result.lastVerified.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certificado de Integridade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded font-mono text-xs space-y-2">
                <p>
                  <span className="text-muted-foreground">Merkle Root:</span>{" "}
                  {result.merkleRoot}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {result.isValid ? "✓ VÁLIDO" : "✗ INVÁLIDO"}
                </p>
                <p>
                  <span className="text-muted-foreground">Eventos:</span>{" "}
                  {result.eventCount}
                </p>
                <p>
                  <span className="text-muted-foreground">Verificado em:</span>{" "}
                  {result.lastVerified.toISOString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

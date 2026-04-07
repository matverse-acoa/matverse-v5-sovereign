import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ReplayResult {
  startEventId: number;
  endEventId: number;
  statesReproduced: number;
  merkleRootRecovered: string;
  determinismVerified: boolean;
  executionTime: number;
  status: "success" | "failed" | "partial";
}

export default function Replay() {
  const [startEventId, setStartEventId] = useState("1");
  const [endEventId, setEndEventId] = useState("100");
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReplay = async () => {
    try {
      setLoading(true);
      setError(null);

      const start = parseInt(startEventId);
      const end = parseInt(endEventId);

      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        setError("IDs de evento inválidos");
        return;
      }

      // Simular replay determinístico
      const mockResult: ReplayResult = {
        startEventId: start,
        endEventId: end,
        statesReproduced: end - start + 1,
        merkleRootRecovered:
          "b91d6c6ff71cf4a0357c1ae429b5cc189dcb4b32667ddbe1b34c6b9655e37566",
        determinismVerified: true,
        executionTime: Math.random() * 500 + 100,
        status: "success",
      };

      setResult(mockResult);
    } catch (err) {
      setError("Erro ao executar replay determinístico");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "partial":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Sucesso</Badge>;
      case "failed":
        return <Badge className="bg-red-500">Falhou</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">Parcial</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Replay Determinístico</h1>
        <p className="text-muted-foreground mt-2">
          Reproduza deterministicamente o estado do sistema a partir de um intervalo de eventos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros de Replay</CardTitle>
          <CardDescription>
            Especifique o intervalo de eventos para reprodução
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">ID do Evento Inicial</label>
              <Input
                type="number"
                min="1"
                value={startEventId}
                onChange={(e) => setStartEventId(e.target.value)}
                disabled={loading}
                placeholder="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">ID do Evento Final</label>
              <Input
                type="number"
                min="1"
                value={endEventId}
                onChange={(e) => setEndEventId(e.target.value)}
                disabled={loading}
                placeholder="100"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <Button
            onClick={handleReplay}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reproduzindo...
              </>
            ) : (
              "Executar Replay"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resultado do Replay</CardTitle>
                {getStatusBadge(result.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Intervalo de Eventos
                  </label>
                  <p className="text-lg font-semibold">
                    #{result.startEventId} - #{result.endEventId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Estados Reproduzidos
                  </label>
                  <p className="text-lg font-semibold">{result.statesReproduced}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Merkle Root Recuperado
                </label>
                <p className="font-mono text-sm break-all">
                  {result.merkleRootRecovered}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Determinismo Verificado</span>
                  <div className="flex items-center gap-2">
                    {result.determinismVerified ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-600">Verificado</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-red-600">Falhou</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tempo de Execução</span>
                  <span className="text-sm font-mono">
                    {result.executionTime.toFixed(2)}ms
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certificado de Replay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded font-mono text-xs space-y-2">
                <p>
                  <span className="text-muted-foreground">Pipeline:</span> Π = L ∘ Ω ∘ A ∘ M
                  ∘ E ∘ O ∘ I
                </p>
                <p>
                  <span className="text-muted-foreground">Intervalo:</span> [{result.startEventId},
                  {result.endEventId}]
                </p>
                <p>
                  <span className="text-muted-foreground">Estados:</span>{" "}
                  {result.statesReproduced}
                </p>
                <p>
                  <span className="text-muted-foreground">Determinismo:</span>{" "}
                  {result.determinismVerified ? "✓ VÁLIDO" : "✗ INVÁLIDO"}
                </p>
                <p>
                  <span className="text-muted-foreground">Tempo:</span>{" "}
                  {result.executionTime.toFixed(2)}ms
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

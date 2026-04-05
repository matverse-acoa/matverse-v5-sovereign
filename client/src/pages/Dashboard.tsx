import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);

  const ledgerQuery = trpc.ledger.history.useQuery({ limit: 50, offset: 0 });
  const evaluateOmega = trpc.omega.evaluate.useMutation();

  useEffect(() => {
    if (ledgerQuery.data) {
      const transformed = ledgerQuery.data.map((event: any) => ({
        timestamp: new Date(event.createdAt).toLocaleTimeString(),
        psi: event.psi / 1000,
        cvar: event.cvar / 1000,
        omega: event.omega / 1000,
        decision: event.decision,
      }));
      setMetrics(transformed);
      if (transformed.length > 0) {
        setCurrentMetrics(transformed[transformed.length - 1]);
      }
    }
  }, [ledgerQuery.data]);

  const handleEvaluate = async () => {
    try {
      await evaluateOmega.mutateAsync({
        psi: 0.95,
        theta: 50,
        cvar: 0.02,
        pole: 1,
      });
      ledgerQuery.refetch();
    } catch (error) {
      console.error("Failed to evaluate:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa estar autenticado para acessar o dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Role de usuário: {user?.role}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">MatVerse V5 Sovereign - VibeCoding Dashboard</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Coerência (Ψ)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {currentMetrics ? (currentMetrics.psi * 100).toFixed(2) : "0"}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risco (CVaR)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {currentMetrics ? (currentMetrics.cvar * 100).toFixed(2) : "0"}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validação (Ω)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {currentMetrics ? (currentMetrics.omega * 100).toFixed(2) : "0"}%
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Status: {currentMetrics?.decision === "PASS" ? "✓ PASS" : "✗ BLOCK"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Evolução de Métricas</CardTitle>
            <CardDescription>Histórico de coerência, risco e validação</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="psi" stroke="#3b82f6" name="Coerência (Ψ)" />
                <Line type="monotone" dataKey="cvar" stroke="#ef4444" name="Risco (CVaR)" />
                <Line type="monotone" dataKey="omega" stroke="#10b981" name="Validação (Ω)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Decisões Ω-GATE</CardTitle>
            <CardDescription>Distribuição de decisões (PASS/BLOCK)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.slice(-10).reverse().map((m, i) => (
                <div key={i} className="flex justify-between items-center p-2 border rounded">
                  <span>{m.timestamp}</span>
                  <span className={`px-3 py-1 rounded ${m.decision === "PASS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {m.decision}
                  </span>
                  <span className="text-sm text-gray-600">Ω={(m.omega * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleEvaluate} disabled={evaluateOmega.isPending}>
            {evaluateOmega.isPending ? "Avaliando..." : "Avaliar Métricas"}
          </Button>
          <Button variant="outline" onClick={() => ledgerQuery.refetch()}>
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
}

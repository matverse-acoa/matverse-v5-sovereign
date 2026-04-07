import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Streamdown } from "streamdown";
import { Link } from "wouter";
import { BarChart3, Anchor, CheckCircle2, RotateCw } from "lucide-react";

export default function Home() {
  const { isAuthenticated, logout } = useAuth();

  const features = [
    {
      icon: BarChart3,
      title: "Dashboard",
      description: "Visualize fluxo de coerência (Ψ) e risco (CVaR)",
      href: "/dashboard",
    },
    {
      icon: Anchor,
      title: "Ancoragens",
      description: "Status de ancoragens on-chain na Sepolia",
      href: "/anchors",
    },
    {
      icon: CheckCircle2,
      title: "Auditoria",
      description: "Verificação de integridade criptográfica",
      href: "/audit",
    },
    {
      icon: RotateCw,
      title: "Replay",
      description: "Reprodução determinística de estados",
      href: "/replay",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">MatVerse V5 Sovereign</h1>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="default">Dashboard</Button>
                </Link>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default">Login</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 space-y-12">
        <section>
          <h2 className="text-3xl font-bold mb-4">Plataforma de Governança Soberana</h2>
          <Streamdown>
## Bem-vindo ao MatVerse V5 Sovereign

Esta plataforma implementa governança soberana baseada em coerência (Ψ), risco (CVaR) e prova criptográfica.

### Funcionalidades

- **Motor Ω-GATE V5**: Avaliação de governança com equação central (0.4Ψ + 0.3Θ̂ + 0.2(1−CVaR) + 0.1⋅PoLE)
- **Ledger Imutável**: Registro append-only com SHA-256 e encadeamento de hashes
- **Merkle Tree**: Auditoria criptográfica com prova de integridade
- **Integração Web3**: Ancoragem on-chain na Sepolia
- **Dashboard VibeCoding**: Visualização de fluxo em tempo real
- **API de Replay**: Reprodução determinística de estados (Pipeline Π)
          </Streamdown>
        </section>

        {isAuthenticated && (
          <section className="space-y-6">
            <h3 className="text-2xl font-bold">Navegação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.href} href={feature.href}>
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <CardTitle className="flex items-center gap-2">
                              <Icon className="w-5 h-5" />
                              {feature.title}
                            </CardTitle>
                            <CardDescription>{feature.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" className="w-full">
                          Acessar →
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {!isAuthenticated && (
          <section className="text-center py-12">
            <h3 className="text-2xl font-bold mb-4">Faça login para começar</h3>
            <p className="text-muted-foreground mb-6">
              Autentique-se com sua conta Manus para acessar o dashboard e todas as funcionalidades
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg">Login com Manus</Button>
            </a>
          </section>
        )}
      </main>
    </div>
  );
}

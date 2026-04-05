import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Streamdown } from "streamdown";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated, logout } = useAuth();

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

      <main className="flex-1 max-w-7xl mx-auto w-full p-8">
        <h2 className="text-3xl font-bold mb-4">Plataforma de Governança Soberana</h2>
        <Streamdown>
## Bem-vindo ao MatVerse V5 Sovereign

Esta plataforma implementa governança soberana baseada em coerência (Ψ), risco (CVaR) e prova criptográfica.

### Funcionalidades

- **Motor Ω-GATE V5**: Avaliação de governança com equação central
- **Ledger Imutável**: Registro append-only com SHA-256
- **Merkle Tree**: Auditoria criptográfica com prova de integridade
- **Integração Web3**: Ancoragem on-chain na Sepolia
- **Dashboard VibeCoding**: Visualização de fluxo em tempo real
        </Streamdown>
        {isAuthenticated && (
          <div className="mt-8">
            <Link href="/dashboard">
              <Button size="lg">Acessar Dashboard</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

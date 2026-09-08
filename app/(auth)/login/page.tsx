import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Connexion — Smart Sim" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Logo + titre */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-3">
          <Logo size={44} />
          <span className="text-2xl font-bold tracking-tight text-fg">
            SIM<span className="text-brand">BET</span>
          </span>
        </div>
        <p className="text-fg-secondary text-sm">
          Connectez-vous pour accéder à vos analyses.
        </p>
      </div>

      {/* Card glassmorphism */}
      <div className="rounded-xl border border-soft bg-gradient-card backdrop-blur-md shadow-card p-7 space-y-5">
        <div>
          <h1 className="text-fg text-xl font-semibold">Bienvenue</h1>
          <p className="text-fg-muted text-xs mt-1">
            Entre tes identifiants pour continuer.
          </p>
        </div>
        <LoginForm />
        <div className="pt-3 border-t border-soft text-center text-sm text-fg-secondary">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-brand font-semibold hover:text-brand-hover">
            Créer un compte
          </Link>
        </div>
      </div>

      <p className="text-center text-fg-muted text-xs">
        Vos données sont sécurisées (Supabase Auth).
      </p>
    </div>
  );
}

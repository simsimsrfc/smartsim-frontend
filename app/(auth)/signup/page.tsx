import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Inscription — Smart Sim" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-3">
          <Logo size={44} />
          <span className="text-2xl font-bold tracking-tight text-fg">
            SIM<span className="text-brand">BET</span>
          </span>
        </div>
        <p className="text-fg-secondary text-sm">
          Crée ton compte pour accéder aux analyses.
        </p>
      </div>

      <div className="rounded-xl border border-soft bg-gradient-card backdrop-blur-md shadow-card p-7 space-y-5">
        <div>
          <h1 className="text-fg text-xl font-semibold">Créer un compte</h1>
          <p className="text-fg-muted text-xs mt-1">
            Quelques infos pour commencer.
          </p>
        </div>
        <SignupForm />
        <div className="pt-3 border-t border-soft text-center text-sm text-fg-secondary">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-brand font-semibold hover:text-brand-hover">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

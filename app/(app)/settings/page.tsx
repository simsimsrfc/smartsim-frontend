import { User, LogOut, Mail, Shield } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { BankrollSection } from "./BankrollSection";
import { isAdmin } from "@/lib/admin";

export const metadata = { title: "Paramètres — Smart Sim" };

export default async function SettingsPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Gère ton compte et tes préférences." />

      {/* Profil */}
      <section className="rounded-xl border border-soft bg-gradient-card shadow-card p-6 mb-5">
        <h2 className="text-fg text-base font-semibold mb-5 flex items-center gap-2">
          <User size={18} className="text-brand" /> Profil
        </h2>
        <div className="space-y-4 max-w-md">
          <Field icon={<Mail size={16} />} label="Adresse e-mail" value={user?.email || "—"} />
          <Field
            icon={<Shield size={16} />}
            label="Identifiant"
            value={user?.id ? user.id.slice(0, 8) + "…" : "—"}
            mono
          />
        </div>
      </section>

      {/* Bankroll — admin uniquement */}
      {isAdmin(user?.email) && user?.email && (
        <BankrollSection userEmail={user.email} />
      )}

      {/* Session */}
      <section className="rounded-xl border border-soft bg-gradient-card shadow-card p-6">
        <h2 className="text-fg text-base font-semibold mb-4 flex items-center gap-2">
          <LogOut size={18} className="text-brand" /> Session
        </h2>
        <p className="text-fg-secondary text-sm mb-4 max-w-md">
          Déconnecte-toi de ce navigateur. Tu pourras te reconnecter à tout moment.
        </p>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-danger/10 border border-danger/30 text-danger font-semibold text-sm hover:bg-danger/20 transition-colors"
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-fg-muted mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div
        className={`h-11 px-3 flex items-center rounded-md border border-soft bg-white/[0.025] text-fg text-sm ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

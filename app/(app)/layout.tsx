import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { createSupabaseServer } from "@/lib/supabase/server";
import { UserProvider } from "@/components/providers/UserProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <UserProvider email={user?.email ?? null}>
    <div className="min-h-screen overflow-x-hidden bg-[#050B12]">
      {/* Desktop sidebar — inchangée (lg+) */}
      <Sidebar userEmail={user?.email ?? null} />

      {/* Mobile header — visible uniquement < lg */}
      <MobileHeader />

      <main className="min-h-screen bg-[#03080A] lg:ml-[260px]">
        {/*
          Padding desktop conservé (px-9 pt-8 pb-12).
          Mobile : px-4 pt-4 ; padding-bottom augmenté pour éviter le chevauchement
          avec la bottom nav (~64-72px) + safe-area iPhone.
        */}
        <div className="mx-auto max-w-[1460px] px-4 pb-[max(calc(env(safe-area-inset-bottom)+96px),96px)] pt-4 sm:px-6 lg:px-9 lg:pb-12 lg:pt-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation — visible uniquement < lg */}
      <MobileBottomNav />
    </div>
    </UserProvider>
  );
}

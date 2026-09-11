import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { CombosClient } from "./CombosClient";

export const metadata = { title: "Combos bankroll — Smart Sim" };

export default async function CombosPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) redirect("/");
  return <CombosClient userEmail={user!.email!} />;
}

"use server";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export type SignupState = {
  error: string | null;
  info?: string;
};

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const password2 = String(formData.get("password2") || "");

  if (!email || !password) return { error: "Email et mot de passe requis." };
  if (password.length < 6) return { error: "Mot de passe trop court (6 minimum)." };
  if (password !== password2) return { error: "Les mots de passe ne correspondent pas." };

  const supabase = createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: error.message || "Inscription impossible." };
  // Si confirmation email activée → pas de session immédiate
  if (!data.session) {
    return { error: null, info: "Compte créé. Vérifie tes emails pour confirmer." };
  }
  redirect("/");
}

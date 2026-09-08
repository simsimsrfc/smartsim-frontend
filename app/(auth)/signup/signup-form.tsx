"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Mail, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = { error: null };

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-11 rounded-md bg-brand text-bg-app font-semibold shadow-button hover:bg-brand-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      Créer mon compte
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(signupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field icon={<Mail size={16} />} name="email" type="email" placeholder="Adresse e-mail" autoComplete="email" required />
      <Field icon={<Lock size={16} />} name="password" type="password" placeholder="Mot de passe (6 min)" autoComplete="new-password" required minLength={6} />
      <Field icon={<Lock size={16} />} name="password2" type="password" placeholder="Confirme le mot de passe" autoComplete="new-password" required minLength={6} />
      {state?.error && (
        <p className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-md px-3 py-2">{state.error}</p>
      )}
      {state?.info && (
        <p className="text-brand text-sm bg-brand/10 border border-green rounded-md px-3 py-2 flex items-start gap-2">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          {state.info}
        </p>
      )}
      <SubmitBtn />
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  const { icon, ...rest } = props;
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">{icon}</span>
      <input
        {...rest}
        className="w-full h-11 pl-10 pr-3 rounded-md bg-white/[0.04] border border-soft text-fg placeholder:text-fg-muted text-sm focus:outline-none focus:border-green focus:bg-white/[0.06] transition-colors"
      />
    </div>
  );
}

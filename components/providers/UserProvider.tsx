"use client";
import { createContext, useContext } from "react";

const UserCtx = createContext<{ email: string | null }>({ email: null });

export function UserProvider({ email, children }: { email: string | null; children: React.ReactNode }) {
  return <UserCtx.Provider value={{ email }}>{children}</UserCtx.Provider>;
}

export function useUserEmail(): string | null {
  return useContext(UserCtx).email;
}

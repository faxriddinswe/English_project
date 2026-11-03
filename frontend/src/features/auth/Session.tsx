"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { api, ApiError } from "@/lib/api/client";
export interface SessionUser {
  id: string;
  username: string;
  role: "teacher" | "student";
  must_change_password: boolean;
}
const SessionContext = createContext<SessionUser | null>(null);
export const useSession = () => useContext(SessionContext)!;
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 0, refetchOnWindowFocus: true },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
export function AuthGate({
  role,
  children,
}: {
  role: "teacher" | "student";
  children: ReactNode;
}) {
  const q = useQuery({
    queryKey: ["session"],
    queryFn: () => api<SessionUser>("/auth/me"),
    retry: false,
  });
  if (q.isPending)
    return (
      <main className="container prose-page" aria-busy="true">
        <p>Kabinet yuklanmoqda…</p>
        <div className="skeleton" />
      </main>
    );
  if (q.error)
    return (
      <main className="container prose-page">
        <h1>
          {q.error instanceof ApiError && q.error.status === 401
            ? "Kabinetga kiring"
            : "Ulanish mavjud emas"}
        </h1>
        <p>{q.error.message}</p>
        <Link className="button" href="/login">
          Kirish
        </Link>
        <button className="button secondary" onClick={() => q.refetch()}>
          Qayta urinish
        </button>
      </main>
    );
  if (q.data.must_change_password)
    return (
      <main className="container prose-page">
        <h1>Parolingizni almashtiring</h1>
        <p>Vaqtinchalik parol bilan kirgansiz.</p>
        <Link className="button" href="/change-password">
          Parolni almashtirish
        </Link>
      </main>
    );
  if (q.data.role !== role)
    return (
      <main className="container prose-page">
        <h1>Ruxsat yo‘q</h1>
        <Link className="button" href={`/${q.data.role}`}>
          O‘z kabinetimga o‘tish
        </Link>
      </main>
    );
  return (
    <SessionContext.Provider value={q.data}>{children}</SessionContext.Provider>
  );
}

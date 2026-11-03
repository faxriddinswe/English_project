"use client";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { notify } from "@/lib/notifications";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { mutation, api } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import type { SessionUser } from "./Session";
export function PasswordForm() {
  const router = useRouter(),
    [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<{ current_password: string; new_password: string }>();
  return (
    <main className="auth-page">
      <div className="auth-card panel">
        <BrandLogo size="md" />
        <h1>Parolni almashtirish</h1>
        <p>Yangi parolni kiriting. Boshqa qurilmalardagi kirishlar yopiladi.</p>
        <form
          noValidate
          onSubmit={handleSubmit(
            async (data) => {
              setError("");
              try {
                await mutation("/auth/change-password", data);
                const me = await api<SessionUser>("/auth/me");
                router.replace(`/${me.role}`);
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              }
            },
            () =>
              notify({
                kind: "error",
                title: "Maydonlarni tekshiring.",
                description: "Amaldagi va yangi parolni kiriting.",
              }),
          )}
        >
          <div className="form-field">
            <label htmlFor="current-password">Amaldagi parol</label>
            <PasswordInput
              id="current-password"
              visibilityLabel="Amaldagi parol"
              autoComplete="current-password"
              aria-invalid={!!errors.current_password}
              aria-describedby={
                errors.current_password ? "current-password-error" : undefined
              }
              {...register("current_password", {
                required: "Amaldagi parolni kiriting",
              })}
            />
            {errors.current_password && (
              <span id="current-password-error" className="field-error">
                {errors.current_password.message}
              </span>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="new-password">Yangi parol</label>
            <PasswordInput
              id="new-password"
              visibilityLabel="Yangi parol"
              autoComplete="new-password"
              aria-invalid={!!errors.new_password}
              aria-describedby={
                errors.new_password ? "new-password-error" : undefined
              }
              {...register("new_password", {
                required: "Yangi parolni kiriting",
              })}
            />
            {errors.new_password && (
              <span id="new-password-error" className="field-error">
                {errors.new_password.message}
              </span>
            )}
          </div>
          {error && (
            <p role="alert" className="error-box">
              {error}
            </p>
          )}
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? "Saqlanmoqda…" : "Parolni almashtirish"}
          </button>
        </form>
        <Link href="/">← Ochiq sayt</Link>
      </div>
    </main>
  );
}

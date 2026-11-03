"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notify } from "@/lib/notifications";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { api, mutation, ApiError } from "@/lib/api/client";
import type { SessionUser } from "./Session";

const loginSchema = z.object({
  username: z.string().min(1, "Telefon raqami yoki loginni kiriting"),
  password: z.string().min(1, "Parolni kiriting"),
});

const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Ism va familiyangizni to‘liq kiriting")
    .max(200),
  phone: z
    .string()
    .min(9, "Telefon raqamini kiriting")
    .refine((v) => {
      const digits = v.replace(/[\s()+-]/g, "");
      return /^\d{9}$/.test(digits) || /^998\d{9}$/.test(digits);
    }, "To‘g‘ri telefon raqami kiriting (masalan, +998901234567)"),
  password: z.string().min(1, "Parolni kiriting"),
  course_id: z.string().optional(),
});

type LoginInputs = z.infer<typeof loginSchema>;
type RegisterInputs = z.infer<typeof registerSchema>;

interface CourseOption {
  id: string;
  name: string;
}

export function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loginError, setLoginError] = useState("");
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(false);
  const [courseAttempt, setCourseAttempt] = useState(0);

  // Fetch available courses for registration dropdown
  useEffect(() => {
    let alive = true;
    api<{ items: CourseOption[] }>("/public/courses")
      .then((res) => {
        if (alive) setCourses(res.items ?? []);
      })
      .catch(() => {
        if (alive) setCoursesError(true);
      })
      .finally(() => {
        if (alive) setCoursesLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [courseAttempt]);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { isSubmitting: isLoggingIn, errors: loginErrors },
  } = useForm<LoginInputs>({ resolver: zodResolver(loginSchema) });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    reset: resetSignup,
    formState: { isSubmitting: isRegistering, errors: registerErrors },
  } = useForm<RegisterInputs>({ resolver: zodResolver(registerSchema) });

  const onLogin = async (data: LoginInputs) => {
    setLoginError("");
    setIsPendingApproval(false);
    try {
      const user = await mutation<SessionUser>("/auth/login", data);
      router.replace(
        user.must_change_password ? "/change-password" : `/${user.role}`,
      );
      router.refresh();
    } catch (e) {
      if (
        (e as ApiError).code === "pending_approval" ||
        (e as Error).message.includes("ko‘rib chiqilmoqda")
      ) {
        setIsPendingApproval(true);
      } else {
        setLoginError((e as Error).message);
      }
    }
  };

  const onRegister = async (data: RegisterInputs) => {
    try {
      const payload: {
        full_name: string;
        phone: string;
        password: string;
        course_id?: string;
      } = {
        full_name: data.full_name.trim(),
        phone: data.phone.trim(),
        password: data.password,
      };
      if (data.course_id) {
        payload.course_id = data.course_id;
      }

      const res = await mutation<{ status: string; message: string }>(
        "/auth/register",
        payload,
      );
      setRegisterSuccess(res.message);
      resetSignup();
      notify({
        kind: "success",
        title: "Arizangiz qabul qilindi",
        description: res.message,
      });
    } catch (e) {
      notify({
        kind: "error",
        title: "Ro‘yxatdan o‘tishda xatolik",
        description: (e as Error).message,
      });
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card panel">
        <BrandLogo size="md" />

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "login"}
            className={`auth-tab-btn ${tab === "login" ? "active" : ""}`}
            onClick={() => {
              setTab("login");
              setLoginError("");
            }}
          >
            Kirish
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "register"}
            className={`auth-tab-btn ${tab === "register" ? "active" : ""}`}
            onClick={() => {
              setTab("register");
              setRegisterSuccess(null);
            }}
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>

        {tab === "login" ? (
          <>
            <h1>Kabinetga kirish</h1>
            <p className="muted">
              Telefon raqamingiz va parolingiz bilan shaxsiy kabinetingizga
              kiring.
            </p>

            {isPendingApproval && (
              <div className="pending-notice-box" role="alert">
                <div className="pending-notice-icon">⏳</div>
                <div className="pending-notice-text">
                  <strong>Arizangiz ko‘rib chiqilmoqda</strong>
                  <p>
                    Arizangiz Sherzod ustozga yuborilgan. Tasdiqlanganingizdan
                    keyin kabinetingizga to‘liq kira olasiz.
                  </p>
                </div>
              </div>
            )}

            <form
              noValidate
              onSubmit={handleLoginSubmit(onLogin, () =>
                notify({
                  kind: "error",
                  title: "Maydonlarni tekshiring.",
                  description: "Telefon raqami yoki login va parolni kiriting.",
                }),
              )}
            >
              <div className="form-field">
                <label htmlFor="login-username">
                  Telefon raqami yoki login
                </label>
                <input
                  id="login-username"
                  placeholder="+998901234567"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoComplete="username"
                  aria-invalid={!!loginErrors.username}
                  aria-describedby={
                    loginErrors.username ? "login-username-error" : undefined
                  }
                  {...registerLogin("username")}
                />
                {loginErrors.username && (
                  <span id="login-username-error" className="field-error">
                    {loginErrors.username.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="login-password">Parol</label>
                <PasswordInput
                  id="login-password"
                  autoComplete="current-password"
                  aria-invalid={!!loginErrors.password}
                  aria-describedby={
                    loginErrors.password ? "login-password-error" : undefined
                  }
                  {...registerLogin("password")}
                />
                {loginErrors.password && (
                  <span id="login-password-error" className="field-error">
                    {loginErrors.password.message}
                  </span>
                )}
              </div>

              {loginError && !isPendingApproval && (
                <p className="error-box" role="alert">
                  {loginError}
                </p>
              )}

              <button type="submit" className="button" disabled={isLoggingIn}>
                {isLoggingIn ? "Tekshirilmoqda…" : "Kirish"}
              </button>
            </form>

            <div className="auth-footer-prompt">
              <span>Hali ro‘yxatdan o‘tmadingizmi?</span>{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => setTab("register")}
              >
                Ro‘yxatdan o‘tish →
              </button>
            </div>
          </>
        ) : (
          <>
            <h1>Ro‘yxatdan o‘tish</h1>
            <p className="muted">
              Ma’lumotlaringizni kiriting va kelgusida kirish uchun o‘zingiz
              parol o‘ylab toping.
            </p>

            {registerSuccess ? (
              <div className="auth-success-card" role="status">
                <div className="success-icon">✓</div>
                <h3>Arizangiz muvaffaqiyatli qabul qilindi!</h3>
                <p className="muted">
                  Arizangiz ko‘rib chiqilmoqda. Sherzod ustoz tasdiqlaganidan
                  keyin telefon raqamingiz va o‘ylab topgan parolingiz bilan
                  kabinetga kirishingiz mumkin.
                </p>
                <button
                  type="button"
                  className="button"
                  style={{ marginTop: "1rem" }}
                  onClick={() => {
                    setTab("login");
                    setRegisterSuccess(null);
                  }}
                >
                  Kirish bo‘limiga o‘tish
                </button>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={handleSignupSubmit(onRegister, () =>
                  notify({
                    kind: "error",
                    title: "Maydonlarni tekshiring.",
                    description:
                      "Barcha kerakli ma’lumotlarni to‘g‘ri kiriting.",
                  }),
                )}
              >
                <div className="form-field">
                  <label htmlFor="reg-fullname">Ism va familiya *</label>
                  <input
                    id="reg-fullname"
                    placeholder="Masalan: Azizbek Rahimov"
                    autoComplete="name"
                    aria-invalid={!!registerErrors.full_name}
                    aria-describedby={
                      registerErrors.full_name
                        ? "reg-fullname-error"
                        : undefined
                    }
                    {...registerSignup("full_name")}
                  />
                  {registerErrors.full_name && (
                    <span id="reg-fullname-error" className="field-error">
                      {registerErrors.full_name.message}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="reg-phone">Telefon raqamingiz *</label>
                  <input
                    id="reg-phone"
                    placeholder="+998901234567"
                    type="tel"
                    autoComplete="tel"
                    aria-invalid={!!registerErrors.phone}
                    aria-describedby={
                      registerErrors.phone ? "reg-phone-error" : undefined
                    }
                    {...registerSignup("phone")}
                  />
                  {registerErrors.phone && (
                    <span id="reg-phone-error" className="field-error">
                      {registerErrors.phone.message}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="reg-password">
                    Parol (kelgusida kirish uchun o‘zingiz o‘ylab toping) *
                  </label>
                  <PasswordInput
                    id="reg-password"
                    placeholder="O‘zingiz tanlagan parol"
                    autoComplete="new-password"
                    aria-invalid={!!registerErrors.password}
                    aria-describedby={
                      registerErrors.password ? "reg-password-error" : undefined
                    }
                    {...registerSignup("password")}
                  />
                  {registerErrors.password && (
                    <span id="reg-password-error" className="field-error">
                      {registerErrors.password.message}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="reg-course">
                    Qaysi kursga qo‘shilmoqchisiz?
                  </label>
                  <select
                    id="reg-course"
                    className="select-input"
                    disabled={
                      coursesLoading || coursesError || courses.length === 0
                    }
                    aria-describedby={
                      coursesError ? "reg-course-error" : undefined
                    }
                    {...registerSignup("course_id")}
                  >
                    <option value="">
                      {coursesLoading
                        ? "Kurslar yuklanmoqda…"
                        : "Kursni keyin tanlayman"}
                    </option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {coursesError && (
                    <div id="reg-course-error" role="status">
                      <p className="field-error">
                        Kurslar yuklanmadi. Kursni keyin tanlashingiz yoki qayta
                        urinishingiz mumkin.
                      </p>
                      <button
                        type="button"
                        className="button secondary small"
                        onClick={() => {
                          setCoursesError(false);
                          setCoursesLoading(true);
                          setCourseAttempt((attempt) => attempt + 1);
                        }}
                      >
                        Kurslarni qayta yuklash
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="button"
                  disabled={isRegistering}
                >
                  {isRegistering ? "Yuborilmoqda…" : "Ro‘yxatdan o‘tish"}
                </button>
              </form>
            )}

            <div className="auth-footer-prompt">
              <span>Allaqachon hisobingiz bormi?</span>{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => setTab("login")}
              >
                Kirish →
              </button>
            </div>
          </>
        )}

        <Link href="/" className="auth-home-link">
          ← Ochiq saytga qaytish
        </Link>
      </div>
    </main>
  );
}

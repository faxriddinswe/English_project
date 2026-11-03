"use client";
import { notify } from "@/lib/notifications";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Dialog } from "@/components/ui/Dialog";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { mutation } from "@/lib/api/client";
import type { Course } from "@/lib/api/public";
import styles from "./LeadApplicationModal.module.css";

const schema = z.object({
  full_name: z.string().trim().min(2, "Ismingizni kiriting").max(200),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s()+-]/g, ""))
    .transform((v) => (v.length === 9 ? "998" + v : v))
    .refine((v) => /^998\d{9}$/.test(v), "+998XXXXXXXXX raqamini kiriting"),
  course_id: z.string(),
  comment: z.string().max(2000),
  privacy_accepted: z
    .boolean()
    .refine(Boolean, "Maxfiylik xabarini tasdiqlang"),
});
type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;

function LeadApplication({
  mode,
  open = true,
  onOpenChange,
  courses,
  courseId = "",
}: {
  mode: "modal" | "inline";
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  courses: Course[];
  courseId?: string;
}) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      phone: "+998",
      course_id: courseId,
      comment: "",
      privacy_accepted: false,
    },
  });
  const submit = handleSubmit(
    async (data) => {
      setError("");
      try {
        await mutation("/public/leads", {
          ...data,
          phone: "+" + data.phone,
          course_id: data.course_id || null,
          source: window.location.pathname,
          website: "",
        });
        setSuccess(true);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Yuborilmadi. Qayta urinib ko‘ring.",
        );
      }
    },
    () =>
      notify({
        kind: "error",
        title: "Ariza ma’lumotlarini tekshiring.",
        description: "Belgilangan maydonlarni to‘ldiring.",
      }),
  );
  const formContent = (
    <div className={styles.form}>
      <div className={styles.brandRow}>
        <BrandLogo size="sm" />
      </div>
      {success ? (
        <div className={styles.success} role="status">
          <span className={styles.successMark}>✓</span>
          <h2>Arizangiz qabul qilindi.</h2>
          <p>Kurs va darslar bo‘yicha siz bilan bog‘lanamiz.</p>
          {onOpenChange && (
            <button className="button" onClick={() => onOpenChange(false)}>
              Yopish
            </button>
          )}
        </div>
      ) : (
        <>
          <h2>Ingliz tilidagi maqsadingiz sari birinchi qadam.</h2>
          <p className={styles.intro}>
            Ma’lumotlaringizni qoldiring. Kurs va darslar bo‘yicha siz bilan
            bog‘lanamiz.
          </p>
          <form aria-label="Kursga ariza" onSubmit={submit} noValidate>
            <div className={styles.contactFields}>
              <label>
                Ism va familiya
                <input
                  autoComplete="name"
                  {...register("full_name")}
                  aria-invalid={!!errors.full_name}
                />
                {errors.full_name && (
                  <span className="field-error">
                    {errors.full_name.message}
                  </span>
                )}
              </label>
              <label>
                Telefon raqamingiz
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  {...register("phone")}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <span className="field-error">{errors.phone.message}</span>
                )}
              </label>
            </div>
            <label>
              Qiziqqan kurs
              <select {...register("course_id")}>
                <option value="">Tanlashda yordam kerak</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Izoh (ixtiyoriy)
              <textarea rows={2} {...register("comment")} />
            </label>
            <label className="check-label">
              <input type="checkbox" {...register("privacy_accepted")} />
              <span>
                <Link href="/privacy" target="_blank">
                  Maxfiylik xabari
                </Link>{" "}
                bilan tanishdim va bog‘lanish uchun ma’lumotlarimni yuborishga
                roziman.
              </span>
            </label>
            {errors.privacy_accepted && (
              <span className="field-error">
                {errors.privacy_accepted.message}
              </span>
            )}
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
            <button
              className={`button ${styles.submit}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Yuborilmoqda…" : "Arizani yuborish"}
            </button>
          </form>
        </>
      )}
    </div>
  );
  if (mode === "inline")
    return (
      <div
        className={`${styles.surface} ${styles.inline}`}
        data-testid="lead-application-inline"
      >
        {formContent}
      </div>
    );
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange!}
      title="Kursga ariza"
      className={`${styles.surface} ${styles.modal}`}
    >
      {formContent}
    </Dialog>
  );
}

export function LeadApplicationModal(props: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  courses: Course[];
  courseId?: string;
}) {
  if (!props.open) return null;
  return <LeadApplication key={props.courseId ?? ""} mode="modal" {...props} />;
}
export function LeadApplicationForm(props: {
  courses: Course[];
  courseId?: string;
}) {
  return (
    <LeadApplication key={props.courseId ?? ""} mode="inline" {...props} />
  );
}

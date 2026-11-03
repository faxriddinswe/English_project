"use client";
import { FileInput } from "@/components/ui/FileInput";
import { useState, type ReactNode } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { mutation, upload, ApiError } from "@/lib/api/client";
import { notify } from "@/lib/notifications";
import { fieldLabel, labels } from "@/lib/uz";
import { type Row, type Field, states } from "./config";

export const today = () =>
  new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);
export const localTime = (v: unknown) =>
  typeof v === "string"
    ? new Date(new Date(v).getTime() + 5 * 3600 * 1000)
        .toISOString()
        .slice(0, 16)
    : new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 16);

import { Lookup } from "./SearchLookup";
export { Lookup } from "./SearchLookup";

type Rule = { weekday: number; local_time: string; duration_minutes: number };
function Rules({
  value,
  onChange,
}: {
  value: Rule[];
  onChange: (v: Rule[]) => void;
}) {
  return (
    <div className="rules-editor">
      {value.map((r, i) => (
        <div className="rule-row" key={i}>
          <select
            aria-label="Hafta kuni"
            value={r.weekday}
            onChange={(e) =>
              onChange(
                value.map((x, n) =>
                  n === i ? { ...x, weekday: Number(e.target.value) } : x,
                ),
              )
            }
          >
            {[
              "Dushanba",
              "Seshanba",
              "Chorshanba",
              "Payshanba",
              "Juma",
              "Shanba",
              "Yakshanba",
            ].map((d, n) => (
              <option key={n} value={n}>
                {d}
              </option>
            ))}
          </select>
          <input
            aria-label="Dars vaqti (Toshkent)"
            type="time"
            value={r.local_time}
            onChange={(e) =>
              onChange(
                value.map((x, n) =>
                  n === i ? { ...x, local_time: e.target.value } : x,
                ),
              )
            }
          />
          <input
            aria-label="Daqiqa"
            type="number"
            min={15}
            max={480}
            value={r.duration_minutes}
            onChange={(e) =>
              onChange(
                value.map((x, n) =>
                  n === i
                    ? { ...x, duration_minutes: Number(e.target.value) }
                    : x,
                ),
              )
            }
          />
          <button
            type="button"
            aria-label="Jadval qatorini o‘chirish"
            onClick={() => onChange(value.filter((_, n) => i !== n))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button secondary small"
        onClick={() =>
          onChange([
            ...value,
            { weekday: 0, local_time: "17:00", duration_minutes: 90 },
          ])
        }
      >
        + Dars kuni
      </button>
      <small>
        Vaqtlar: Toshkent vaqti. Saqlangan darslar avtomatik o‘zgarmaydi.
      </small>
    </div>
  );
}

const contentFields: Record<string, Field[]> = {
  hero: [{ name: "subheading", label: "Izoh", type: "textarea" }],
  bio: [
    { name: "experience", label: "Tajriba (masalan: 18+ yil)" },
    {
      name: "students_taught",
      label: "Ta’lim olgan o‘quvchilar (masalan: 1000+)",
    },
    { name: "body", label: "Bio va metodika", type: "textarea" },
    { name: "video_url", label: "Video havola", type: "url" },
    {
      name: "certificate_ids",
      label: "Ustoz sertifikatlari",
      type: "media-list",
    },
  ],
  stat: [
    { name: "value", label: "Tasdiqlangan qiymat" },
    { name: "label", label: "Izoh" },
  ],
  benefit: [
    { name: "body", label: "Afzallik izohi", type: "textarea" },
    { name: "tags", label: "Teglar (har qatorda bittadan)", type: "lines" },
  ],
  result: [
    {
      name: "type",
      label: "Imtihon turi",
      type: "select",
      options: ["ielts", "cefr"],
    },
    { name: "student_name", label: "Nashrga ruxsat berilgan ism" },
    { name: "exam_date", label: "Imtihon sanasi", type: "date" },
  ],
  testimonial: [
    { name: "student_name", label: "Ism" },
    { name: "body", label: "Haqiqiy fikr", type: "textarea" },
    { name: "video_url", label: "Haqiqiy video havola", type: "url" },
  ],
  gallery: [
    { name: "alt", label: "Rasm tavsifi" },
    { name: "video_url", label: "Video havola (ixtiyoriy)", type: "url" },
  ],
  faq: [{ name: "body", label: "Javob", type: "textarea" }],
  contact: [
    { name: "phone", label: "Haqiqiy telefon", type: "tel" },
    { name: "address", label: "Manzil" },
    { name: "telegram", label: "Telegram havolasi", type: "url" },
    { name: "instagram", label: "Instagram havolasi", type: "url" },
    { name: "youtube", label: "YouTube havolasi", type: "url" },
  ],
  privacy: [{ name: "body", label: "Maxfiylik matni", type: "textarea" }],
};
function ContentFields({
  kind,
  value,
  onChange,
}: {
  kind: string;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  let fields = [...(contentFields[kind] ?? [])];
  if (kind === "result")
    fields = fields.concat(
      value.type === "cefr"
        ? [
            {
              name: "level",
              label: "SEFR darajasi",
              type: "select",
              options: ["A1", "A2", "B1", "B2", "C1", "C2"],
            },
            { name: "cefr_score", label: "SEFR balli (ixtiyoriy)" },
          ]
        : ["listening", "reading", "writing", "speaking", "overall"].map(
            (name) => ({
              name,
              label:
                name === "overall"
                  ? "Rasmiy umumiy ball"
                  : (labels[name] ?? "Ball"),
              type: "band",
            }),
          ),
    );
  return (
    <div className="content-fields">
      {fields.map((f) => (
        <label key={f.name}>
          {f.label}
          {f.type === "media-list" ? (
            <div className="certificate-list-editor">
              {((value[f.name] ?? []) as string[]).map((id, i) => (
                <div key={id}>
                  <a
                    href={`/api/v1/media/${id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Sertifikat {i + 1} ↗
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        [f.name]: (value[f.name] as string[]).filter(
                          (x) => x !== id,
                        ),
                      })
                    }
                  >
                    Olib tashlash
                  </button>
                </div>
              ))}
              <MediaInput
                value=""
                isPublic
                onChange={(id) =>
                  onChange({
                    ...value,
                    [f.name]: [...((value[f.name] ?? []) as string[]), id],
                  })
                }
              />
            </div>
          ) : f.type === "select" ? (
            <select
              value={String(
                value[f.name] ?? (f.name === "type" ? "ielts" : ""),
              )}
              onChange={(e) =>
                onChange(
                  f.name === "type"
                    ? {
                        student_name: value.student_name ?? "",
                        exam_date: value.exam_date ?? "",
                        type: e.target.value,
                      }
                    : { ...value, [f.name]: e.target.value },
                )
              }
            >
              {f.name !== "type" && <option value="">Tanlang</option>}
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" || f.type === "lines" ? (
            <textarea
              rows={4}
              value={
                Array.isArray(value[f.name])
                  ? (value[f.name] as string[]).join("\n")
                  : String(value[f.name] ?? "")
              }
              onChange={(e) =>
                onChange({
                  ...value,
                  [f.name]:
                    f.type === "lines"
                      ? e.target.value.split("\n")
                      : e.target.value,
                })
              }
            />
          ) : (
            <input
              type={f.type === "band" ? "number" : (f.type ?? "text")}
              step={f.type === "band" ? "0.5" : undefined}
              min={f.type === "band" ? 0 : undefined}
              max={f.type === "band" ? 9 : undefined}
              value={String(value[f.name] ?? "")}
              onChange={(e) =>
                onChange({
                  ...value,
                  ...(kind === "result" && !value.type
                    ? { type: "ielts" }
                    : {}),
                  [f.name]:
                    ["url", "tel"].includes(f.type ?? "") && !e.target.value
                      ? null
                      : e.target.value,
                })
              }
            />
          )}
        </label>
      ))}
    </div>
  );
}

function MediaInput({
  value,
  onChange,
  isPublic,
}: {
  value: string;
  onChange: (id: string) => void;
  isPublic?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [alt, setAlt] = useState("");
  return (
    <div className="media-input">
      {isPublic && (
        <label>
          Ommaviy rasm tavsifi
          <input value={alt} onChange={(e) => setAlt(e.target.value)} />
          <small>
            Faqat rozilik olingan, shaxsiy identifikatorlari berkitilgan alohida
            faylni yuklang.
          </small>
        </label>
      )}
      <FileInput
        aria-label="Fayl tanlash"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setError("");
          try {
            const m = await upload(
              file,
              isPublic ? "public" : "private",
              alt,
              !!isPublic,
            );
            onChange(m.id);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && <small>Yuklanmoqda…</small>}
      {value && (
        <a href={`/api/v1/media/${value}`} target="_blank" rel="noreferrer">
          Yuklangan faylni ko‘rish ↗
        </a>
      )}
      {value && (
        <button type="button" onClick={() => onChange("")}>
          Tanlovni tozalash
        </button>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function EntityForm({
  fields,
  initial = {},
  path,
  method = "POST",
  onSaved,
  transform,
  children,
  submitLabel = "Saqlash",
  idempotent = false,
}: {
  fields: Field[];
  initial?: Record<string, unknown>;
  path: string;
  method?: string;
  onSaved: (row: Row) => void;
  transform?: (v: Record<string, unknown>) => Record<string, unknown>;
  children?: ReactNode;
  submitLabel?: string;
  idempotent?: boolean;
}) {
  const defaults = Object.fromEntries(
    fields.map((f) => {
      let value = initial[f.name];
      if (f.type === "datetime-local")
        value = value ? localTime(value) : f.required ? localTime(value) : "";
      if (value === undefined)
        value =
          f.type === "checkbox"
            ? false
            : f.type === "rules"
              ? []
              : f.type === "content"
                ? {}
                : f.type === "select"
                  ? (f.options?.[0] ?? "")
                  : f.name === "sort_order"
                    ? 0
                    : f.type === "date"
                      ? f.required
                        ? today()
                        : ""
                      : f.type === "month"
                        ? f.required
                          ? today().slice(0, 7)
                          : ""
                        : "";
      if (f.type === "lines" && Array.isArray(value)) value = value.join("\n");
      return [f.name, value ?? ""];
    }),
  );
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError: fieldError,
    formState: { isSubmitting, errors },
  } = useForm<Record<string, unknown>>({ defaultValues: defaults });
  const [error, setError] = useState("");
  const [key] = useState(() => crypto.randomUUID());
  const kind = String(useWatch({ control, name: "kind" }) ?? "hero");
  return (
    <form
      noValidate
      onSubmit={handleSubmit(
        async (raw) => {
          setError("");
          const data = { ...raw };
          for (const f of fields) {
            const v = data[f.name];
            if (f.type === "datetime-local" && typeof v === "string" && v)
              data[f.name] = new Date(v + "+05:00").toISOString();
            if (f.type === "number") data[f.name] = v === "" ? null : Number(v);
            if (f.type === "rules" && Array.isArray(v))
              data[f.name] = v.map((rule) => ({
                weekday: rule.weekday,
                local_time: rule.local_time,
                duration_minutes: rule.duration_minutes,
              }));
            if (f.type === "money" && v === "") data[f.name] = null;
            if (f.type === "lines" && typeof v === "string")
              data[f.name] = v
                .split("\n")
                .map((x) => x.trim())
                .filter(Boolean);
            if (
              ["media", "url", "tel", "date", "month"].includes(f.type ?? "") &&
              v === ""
            )
              data[f.name] = null;
            if (f.type === "datetime-local" && !v) data[f.name] = null;
          }
          if (
            typeof data.month === "string" &&
            /^\d{4}-\d{2}$/.test(data.month)
          ) {
            const [y, m] = data.month.split("-").map(Number);
            const nextY = m === 12 ? y + 1 : y;
            const nextM = m === 12 ? 1 : m + 1;
            const pad = (n: number) => String(n).padStart(2, "0");
            data.period_start = `${y}-${pad(m)}-01`;
            data.period_end = `${nextY}-${pad(nextM)}-01`;
            if (!data.due_date) {
              data.due_date = data.period_start;
            }
          }
          if (
            kind === "result" &&
            data.data &&
            typeof data.data === "object" &&
            !(data.data as Record<string, unknown>).type
          )
            data.data = { ...(data.data as object), type: "ielts" };
          try {
            const result = await mutation<Row>(
              path,
              transform ? transform(data) : data,
              method,
              idempotent ? key : undefined,
            );
            onSaved(result);
          } catch (e) {
            setError((e as Error).message);
            if (e instanceof ApiError) {
              Object.entries(e.fieldErrors).forEach(([name, message]) =>
                fieldError(name, { message }),
              );
              if (Object.keys(e.fieldErrors).length)
                setError(
                  e.message +
                    " " +
                    Object.entries(e.fieldErrors)
                      .map(
                        ([name, message]) =>
                          `${fields.find((f) => f.name === name)?.label ?? fieldLabel(name) ?? "Maydon"}: ${message}`,
                      )
                      .join("; "),
                );
            }
          }
        },
        () =>
          notify({
            kind: "error",
            title: "Majburiy maydonlarni to‘ldiring.",
            description: "Belgilangan maydonlarni tekshiring.",
          }),
      )}
    >
      {children}
      {fields.map((f) =>
        f.type === "checkbox" ? (
          <label className="check-label" key={f.name}>
            <input
              type="checkbox"
              {...register(f.name, {
                required: f.required ? "Bu maydonni to‘ldiring" : false,
              })}
            />
            <span>{f.label}</span>
          </label>
        ) : (
          <div className="form-field" key={f.name}>
            <label htmlFor={`field-${f.name}`}>
              {f.label}
              {f.required ? " *" : ""}
            </label>
            {f.type === "lookup" ? (
              <Controller
                control={control}
                name={f.name}
                rules={{ required: f.required ? "Bu maydonni tanlang" : false }}
                render={({ field }) => (
                  <Lookup
                    id={`field-${f.name}`}
                    label={f.label}
                    endpoint={f.lookup!}
                    value={String(field.value ?? "")}
                    onChange={field.onChange}
                    required={f.required}
                  />
                )}
              />
            ) : f.type === "rules" ? (
              <Controller
                control={control}
                name={f.name}
                rules={{ required: f.required ? "Bu maydonni tanlang" : false }}
                render={({ field }) => (
                  <Rules
                    value={field.value as Rule[]}
                    onChange={field.onChange}
                  />
                )}
              />
            ) : f.type === "content" ? (
              <Controller
                control={control}
                name={f.name}
                rules={{ required: f.required ? "Bu maydonni tanlang" : false }}
                render={({ field }) => (
                  <ContentFields
                    kind={kind}
                    value={field.value as Record<string, unknown>}
                    onChange={field.onChange}
                  />
                )}
              />
            ) : f.type === "media" ? (
              <Controller
                control={control}
                name={f.name}
                rules={{ required: f.required ? "Bu maydonni tanlang" : false }}
                render={({ field }) => (
                  <MediaInput
                    value={String(field.value ?? "")}
                    onChange={field.onChange}
                    isPublic={f.publicMedia}
                  />
                )}
              />
            ) : f.type === "select" ? (
              <select
                id={`field-${f.name}`}
                {...register(f.name, {
                  required: f.required ? "Bu maydonni to‘ldiring" : false,
                })}
                onChange={(e) => {
                  setValue(f.name, e.target.value);
                  if (f.name === "kind") setValue("data", {});
                }}
              >
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {(states[o] ?? o) || "Belgilanmagan"}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" || f.type === "lines" ? (
              <textarea
                id={`field-${f.name}`}
                rows={4}
                required={f.required}
                {...register(f.name, {
                  required: f.required ? "Bu maydonni to‘ldiring" : false,
                })}
              />
            ) : (
              <input
                id={`field-${f.name}`}
                type={
                  ["money", "signed-money"].includes(f.type ?? "")
                    ? "number"
                    : (f.type ?? "text")
                }
                step={
                  ["money", "signed-money"].includes(f.type ?? "")
                    ? "0.01"
                    : undefined
                }
                min={f.type === "money" ? 0 : undefined}
                required={f.required}
                {...register(f.name, {
                  required: f.required ? "Bu maydonni to‘ldiring" : false,
                })}
              />
            )}
            {errors[f.name] && (
              <p className="field-error">{String(errors[f.name]?.message)}</p>
            )}
          </div>
        ),
      )}
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className="button">
        {isSubmitting ? "Saqlanmoqda…" : submitLabel}
      </button>
      <small className="muted">
        Barcha vaqtlar Toshkent vaqti bilan. Saqlash server tasdiqlagandan so‘ng
        yakunlanadi.
      </small>
    </form>
  );
}

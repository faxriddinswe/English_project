"use client";
import { ExcelDownload } from "@/components/ui/ExcelDownload";
import { ScrollTable } from "@/components/ui/ScrollTable";
import { useState } from "react";
import { announceSiteUpdate } from "@/lib/site-updates";
import { groupSchedule } from "./group-schedule";
import Link from "next/link";
import { formatValue } from "@/lib/uz";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Page } from "@/lib/api/public";
import { Dialog } from "@/components/ui/Dialog";
import { EntityForm, today } from "./EntityForm";
import { resources, labels, states, type Row, type Field } from "./config";
import { RecordDetails } from "./RecordDetails";
export { Summary } from "./RecordSummary";

export const display = formatValue;
export function QueryState({
  pending,
  error,
  retry,
}: {
  pending: boolean;
  error: Error | null;
  retry: () => unknown;
}) {
  if (pending)
    return (
      <div aria-busy="true">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  if (error)
    return (
      <div className="error-box" role="alert">
        <p>{error.message}</p>
        <button className="button secondary small" onClick={retry}>
          Qayta urinish
        </button>
      </div>
    );
  return null;
}

export function ResourceView({
  name,
  initialId,
  extraQuery = "",
}: {
  name: string;
  initialId?: string;
  extraQuery?: string;
}) {
  const resource = resources[name];
  const params = useSearchParams();
  let contextQuery = "";
  if (["lessons", "attendance", "payments"].includes(name)) {
    if (params.get("today") === "true")
      contextQuery += "&exclude_cancelled=true";
    if (params.get("unmarked") === "true") contextQuery += "&unmarked=true";
    const day =
      params.get("today") === "true"
        ? today()
        : params.get("month")
          ? params.get("month") + "-01"
          : null;
    if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
      const start = new Date(day + "T00:00:00+05:00");
      let end = new Date(start.getTime() + 86400000);
      if (params.get("month")) {
        const [year, month] = day.split("-").map(Number);
        end = new Date(Date.UTC(year, month, 1) - 5 * 3600000);
      }
      contextQuery += `&start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
    }
  }

  const [page, setPage] = useState(1),
    [size, setSize] = useState(20),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(
      ["leads", "invoices"].includes(name) ? (params.get("status") ?? "") : "",
    ),
    [selected, setSelected] = useState(initialId ?? ""),
    [creating, setCreating] = useState(false),
    [editing, setEditing] = useState(false);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [
      "teacher",
      resource.endpoint,
      page,
      size,
      search,
      status,
      extraQuery,
      contextQuery,
    ],
    queryFn: () =>
      api<Page<Row>>(
        `/teacher/${resource.endpoint}?page=${page}&page_size=${size}&q=${encodeURIComponent(search)}&status=${status}${extraQuery}${contextQuery}`,
      ),
  });
  const detail = useQuery({
    queryKey: ["teacher", resource.endpoint, selected],
    queryFn: () => api<Row>(`/teacher/${resource.endpoint}/${selected}`),
    enabled: !!selected,
  });
  const refresh = () => {
    setCreating(false);
    setEditing(false);
    void client.invalidateQueries({ queryKey: ["teacher"] });
    void client.invalidateQueries({ queryKey: ["lookup"] });
    if (["content", "courses", "certificates"].includes(name))
      announceSiteUpdate();
  };
  const fields =
    name === "students" && editing
      ? resource.fields.filter((f) => f.name !== "joined_on")
      : resource.fields;
  return (
    <>
      <div className="workspace-title">
        <div>
          <h1>{resource.title}</h1>
          <p className="muted">
            {name === "certificates"
              ? "Rozilik va tasdiq bilan saqlangan sertifikat saytda va o‘quvchi kabinetida ko‘rinadi."
              : name === "groups"
                ? "Amaldagi a’zolar va Toshkent vaqti bo‘yicha dars vaqtlari."
                : name === "payments"
                  ? "To‘lovlarni kiriting, hisobga taqsimlang va sabab bilan tuzating."
                  : "Ma’lumotlarni ko‘rish va boshqarish."}
          </p>
        </div>
        {["students", "groups", "leads", "attendance", "assessments"].includes(
          name,
        ) && (
          <ExcelDownload resource={name === "assessments" ? "results" : name}>
            Barcha yozuvlar (Excel)
          </ExcelDownload>
        )}
        {!resource.readOnly && name !== "students" && (
          <button className="button" onClick={() => setCreating(true)}>
            + Yangi qo‘shish
          </button>
        )}
        {name === "students" && (
          <Link className="button secondary" href="/teacher/pending-students">
            Yangi arizalarni ko‘rish →
          </Link>
        )}
      </div>
      <div className="list-toolbar">
        {["students", "leads", "groups", "certificates"].includes(name) && (
          <input
            aria-label="Ism yoki telefon bo‘yicha qidirish"
            placeholder={
              name === "groups"
                ? "Guruh nomi"
                : name === "certificates"
                  ? "Sertifikat yoki o‘quvchi ismi"
                  : "Ism yoki telefon"
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        )}
        {["leads", "invoices"].includes(name) && (
          <select
            aria-label="Holat filtri"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Barcha holatlar</option>
            {(name === "leads"
              ? ["new", "contacted", "trial_scheduled", "converted", "closed"]
              : ["draft", "issued", "void"]
            ).map((x) => (
              <option value={x} key={x}>
                {states[x]}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Sahifadagi yozuvlar"
          value={size}
          onChange={(e) => {
            setSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={20}>20 ta</option>
          <option value={50}>50 ta</option>
        </select>
      </div>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => query.refetch()}
      />
      {query.data && (
        <>
          {query.data.items.length === 0 ? (
            <div className="empty-state panel">
              Hozircha yozuv yo‘q.{" "}
              {resource.readOnly
                ? "Tegishli guruh yoki bo‘limda yozuv yarating."
                : "Yangi yozuv qo‘shishingiz mumkin."}
            </div>
          ) : (
            <ScrollTable label={resource.title}>
              <table>
                <thead>
                  <tr>
                    {resource.columns.map((c) => (
                      <th key={c}>{labels[c] ?? c}</th>
                    ))}
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((row) => (
                    <tr key={row.id}>
                      {resource.columns.map((c) => (
                        <td
                          key={c}
                          className={
                            c === "rules"
                              ? "schedule-cell"
                              : [
                                    "amount",
                                    "paid",
                                    "debt",
                                    "monthly_price",
                                    "payable",
                                  ].includes(c)
                                ? "money-cell"
                                : undefined
                          }
                        >
                          {c === "rules" ? (
                            groupSchedule(row[c])
                          ) : c === "media_url" && row[c] ? (
                            <a
                              href={String(row[c])}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                className="table-certificate"
                                src={String(row[c])}
                                alt={String(row.title)}
                                width={64}
                                height={80}
                              />
                            </a>
                          ) : c.endsWith("_id") ? (
                            <Link
                              href={`/teacher/${c === "student_id" ? "students" : "groups"}/${row[c]}`}
                            >
                              {String(
                                row[
                                  c === "student_id"
                                    ? "student_name"
                                    : "group_name"
                                ] ??
                                  (c === "student_id"
                                    ? "O‘quvchi profili"
                                    : "Guruh"),
                              )}{" "}
                              ↗
                            </Link>
                          ) : (
                            display(row[c], c)
                          )}
                        </td>
                      ))}
                      <td>
                        <button
                          className="button secondary small"
                          onClick={() => {
                            setSelected(row.id);
                          }}
                        >
                          Ochish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
          )}
          <div className="pager">
            <button
              className="button secondary small"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ← Oldingi
            </button>
            <span>
              {page}-sahifa · {query.data.total} ta yozuv
            </span>
            <button
              className="button secondary small"
              disabled={page * size >= query.data.total}
              onClick={() => setPage(page + 1)}
            >
              Keyingi →
            </button>
          </div>
        </>
      )}
      {selected && (
        <Dialog
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected("");
          }}
          title={`${resource.title} — tafsilotlar`}
          className="resource-detail-dialog"
        >
          <QueryState
            pending={detail.isPending}
            error={detail.error}
            retry={() => detail.refetch()}
          />
          {detail.data && (
            <RecordDetails
              key={selected}
              name={name}
              title={resource.title}
              row={detail.data}
              canEdit={
                !resource.readOnly &&
                !["assessments", "payments"].includes(name) &&
                (name !== "invoices" || detail.data.status === "draft") &&
                !detail.data.deleted_at
              }
              onEdit={() => setEditing(true)}
              onSaved={refresh}
              onDeleted={() => {
                setSelected("");
                refresh();
              }}
            />
          )}
        </Dialog>
      )}
      <Dialog
        open={creating || editing}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditing(false);
          }
        }}
        title={editing ? "Tahrirlash" : "Yangi yozuv"}
      >
        <h2>{editing ? "Tahrirlash" : resource.title + " — yangi yozuv"}</h2>
        {(creating || editing) && (
          <EntityForm
            key={editing ? selected : "new"}
            fields={fields}
            initial={
              editing
                ? {
                    ...detail.data,
                    ...(name === "invoices"
                      ? {
                          month: detail.data?.period_start
                            ? String(detail.data.period_start).slice(0, 7)
                            : today().slice(0, 7),
                          due_date: detail.data?.due_date
                            ? String(detail.data.due_date)
                            : today(),
                        }
                      : {}),
                  }
                : {
                    joined_on: today(),
                    ...(name === "invoices"
                      ? {
                          month: today().slice(0, 7),
                          due_date: today(),
                        }
                      : {}),
                    student_id: params.get("student_id") ?? "",
                    ...(name === "certificates" ? { published: true } : {}),
                    ...(name === "certificates" ||
                    extraQuery.includes("kind=result")
                      ? { kind: "result", data: { type: "ielts" } }
                      : {}),
                  }
            }
            path={`/teacher/${resource.endpoint}${editing ? `/${selected}` : ""}`}
            method={editing ? (name === "students" ? "PATCH" : "PUT") : "POST"}
            idempotent={name === "payments"}
            submitLabel={
              name === "certificates" ? "Sertifikatni saqlash" : "Saqlash"
            }
            onSaved={() => refresh()}
          />
        )}
      </Dialog>
    </>
  );
}

export function ActionForm({
  label,
  fields = [],
  path,
  initial,
  onSaved,
  method = "POST",
  description,
  transform,
  danger = false,
}: {
  label: string;
  fields?: Field[];
  path: string;
  initial?: Record<string, unknown>;
  onSaved: () => void;
  method?: string;
  description?: string;
  transform?: (data: Record<string, unknown>) => Record<string, unknown>;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<Row | null>(null);
  return (
    <>
      {danger ? (
        <details className="danger-action">
          <summary>O‘chirish va bekor qilish</summary>
          <p className="muted action-description">
            Bu amalni faqat zarur bo‘lganda bajaring. Tasdiqlash oynasida
            sababini kiriting.
          </p>
          <button className="button danger small" onClick={() => setOpen(true)}>
            {label}
          </button>
        </details>
      ) : (
        <button
          className="button secondary small"
          onClick={() => setOpen(true)}
        >
          {label}
        </button>
      )}
      {result && result.created !== undefined && (
        <span role="status">
          Yaratildi:{" "}
          {Array.isArray(result.created)
            ? result.created.length
            : String(result.created)}
          {Array.isArray(result.skipped)
            ? ` · O‘tkazib yuborildi: ${result.skipped.length}`
            : ""}
        </span>
      )}
      <Dialog open={open} onOpenChange={setOpen} title={label}>
        <h2>{label}</h2>
        {description && <p className="action-description">{description}</p>}
        {open && (
          <EntityForm
            fields={fields}
            initial={initial}
            path={path}
            method={method}
            transform={transform}
            submitLabel={label}
            onSaved={(row) => {
              setResult(row);
              setOpen(false);
              onSaved();
            }}
          />
        )}
      </Dialog>
    </>
  );
}

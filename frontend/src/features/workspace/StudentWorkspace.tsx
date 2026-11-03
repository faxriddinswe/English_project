"use client";
import { FileInput } from "@/components/ui/FileInput";
import { ScrollTable } from "@/components/ui/ScrollTable";
import { useState } from "react";
import { StudentCertificates } from "./StudentCertificates";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mutation, upload } from "@/lib/api/client";
import { Dialog } from "@/components/ui/Dialog";
import type { Page } from "@/lib/api/public";
import { QueryState, display } from "./ResourceView";
import { EntityForm } from "./EntityForm";
import { labels, type Row } from "./config";

function StudentDashboard() {
  const q = useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: () => api<Record<string, unknown>>("/student/dashboard"),
  });
  const d = q.data;
  return (
    <>
      <h1>Mening kabinetim</h1>
      <QueryState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      />
      {d && (
        <>
          <p className="workspace-welcome">
            Assalomu alaykum, {String((d.student as Row).full_name)}.
          </p>
          <div className="metric-grid">
            {[
              ["debt", "Jami qarz"],
              ["overdue", "Muddati o‘tgan"],
              ["unallocated_credit", "Oldindan to‘lov / erkin mablag‘"],
            ].map(([key, label]) => (
              <Link href="/student/billing" className="metric-card" key={key}>
                <span>{label}</span>
                <strong>{display((d.billing as Row)[key], "amount")}</strong>
                <small>O‘z hisoblarim →</small>
              </Link>
            ))}
          </div>
          <div className="dashboard-bottom">
            <section className="panel">
              <h2>Keyingi dars</h2>
              {d.next_lesson ? (
                <>
                  <p>{display((d.next_lesson as Row).starts_at)}</p>
                  <Link
                    className="button secondary small"
                    href="/student/schedule"
                  >
                    Jadvalni ochish
                  </Link>
                </>
              ) : (
                <p className="muted">Hozircha rejalangan dars yo‘q.</p>
              )}
            </section>
            <section className="panel">
              <h2>Yaqin topshirish muddati</h2>
              {d.next_assignment ? (
                <>
                  <p>{String((d.next_assignment as Row).title)}</p>
                  <p>{display((d.next_assignment as Row).deadline)}</p>
                  <Link
                    className="button secondary small"
                    href={`/student/assignments/${(d.next_assignment as Row).id}`}
                  >
                    Vazifani ochish
                  </Link>
                </>
              ) : (
                <p className="muted">Hozircha yaqin topshirish muddati yo‘q.</p>
              )}
            </section>
          </div>
          <section className="panel">
            <h2>Oxirgi ustoz izohi</h2>
            {d.feedback ? (
              <>
                <p className="pre-wrap">
                  {String((d.feedback as Row).feedback)}
                </p>
                <p>
                  {display((d.feedback as Row).score)} /{" "}
                  {display((d.feedback as Row).max_score)}
                </p>
              </>
            ) : (
              <p className="muted">Ustoz izoh berganda shu yerda ko‘rinadi.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}

function AssignmentDetail({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const client = useQueryClient(),
    q = useQuery({
      queryKey: ["student", "assignment", id],
      queryFn: () => api<Row>(`/student/assignments/${id}`),
    });
  const [text, setText] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  const row = q.data;
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Vazifa"
    >
      <QueryState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      />
      {row && (
        <>
          <h2>{String(row.title)}</h2>
          <p className="pre-wrap action-description">
            {String(row.description)}
          </p>
          <p>Muddat: {display(row.deadline)}</p>
          {!!row.link && (
            <a
              href={String(row.link)}
              target="_blank"
              rel="noopener noreferrer"
              className="button secondary small"
            >
              Vazifa havolasi ↗
            </a>
          )}
          {!!row.media_id && (
            <a
              href={`/api/v1/media/${row.media_id}`}
              className="button secondary small"
              target="_blank"
              rel="noreferrer"
            >
              Vazifa fayli ↗
            </a>
          )}
          {!!row.submission && (
            <section className="submission-card">
              <h3>
                Oxirgi javobim — {String((row.submission as Row).revision)}
                -versiya
              </h3>
              <p>
                {(row.submission as Row).late
                  ? "Kech topshirilgan"
                  : "Vaqtida topshirilgan"}
              </p>
              <p className="pre-wrap">{String((row.submission as Row).text)}</p>
              <h3>Ustoz izohi</h3>
              <p className="pre-wrap">
                {String(
                  (row.submission as Row).feedback || "Hali baholanmagan",
                )}
              </p>
              <p>
                {display((row.submission as Row).score)} /{" "}
                {display((row.submission as Row).max_score)}
              </p>
            </section>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPending(true);
              setError("");
              try {
                const asset = file
                  ? await upload(file, "private", "", false, "student")
                  : null;
                await mutation(`/student/assignments/${id}/submission`, {
                  text,
                  media_id: asset?.id ?? null,
                });
                void client.invalidateQueries({ queryKey: ["student"] });
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setPending(false);
              }
            }}
          >
            <label>
              Javobingiz
              <textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={20000}
              />
            </label>
            <label>
              Javob fayli (ixtiyoriy)
              <FileInput
                aria-label="Javob fayli (ixtiyoriy)"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <small className="muted">
              Qayta topshirish yangi topshirish nusxasini yaratadi. Muddatdan
              keyingi topshirish kechikkan deb belgilanadi; ustoz yopgan bo‘lsa
              bloklanadi.
            </small>
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
            <button
              className="button"
              disabled={pending || (!text.trim() && !file)}
            >
              {pending ? "Yuborilmoqda…" : "Javobni topshirish"}
            </button>
          </form>
        </>
      )}
    </Dialog>
  );
}

const configs: Record<string, { title: string; columns: string[] }> = {
  schedule: {
    title: "Dars jadvali",
    columns: ["group_name", "starts_at", "ends_at", "status", "change_reason"],
  },
  assignments: { title: "Vazifalar", columns: ["title", "deadline"] },
  materials: { title: "O‘quv materiallari", columns: ["title"] },
  results: {
    title: "Ichki baholarim",
    columns: ["title", "score", "max_score", "feedback"],
  },
  attendance: { title: "Davomatim", columns: ["starts_at", "status"] },
  billing: {
    title: "Hisoblar va balans",
    columns: ["period_start", "due_date", "payable", "paid", "debt", "status"],
  },
  payments: {
    title: "To‘lovlar tarixi",
    columns: ["amount", "received_at", "method", "void_reason"],
  },
};

function StudentList({
  section,
  initialId,
}: {
  section: string;
  initialId?: string;
}) {
  const config = configs[section],
    [page, setPage] = useState(1),
    [selected, setSelected] = useState(initialId ?? "");
  const q = useQuery({
    queryKey: ["student", section, page],
    queryFn: () =>
      api<Page<Row> & Record<string, unknown>>(
        `/student/${section}?page=${page}`,
      ),
  });
  const data = q.data;
  return (
    <>
      <div className="workspace-title">
        <h1>{config.title}</h1>
        {["billing", "payments"].includes(section) && (
          <nav className="workspace-tabs">
            <Link href="/student/billing">Hisoblar</Link>
            <Link href="/student/payments">To‘lovlar tarixi</Link>
          </nav>
        )}
      </div>
      <QueryState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      />
      {data && (
        <>
          {section === "billing" && (
            <div className="metric-grid">
              {[
                ["debt", "Qarz"],
                ["overdue", "Muddati o‘tgan qarz"],
                ["unallocated_credit", "Erkin mablag‘"],
              ].map(([key, title]) => (
                <div className="metric-card" key={key}>
                  <span>{title}</span>
                  <strong>{display(data[key], "amount")}</strong>
                </div>
              ))}
            </div>
          )}
          {section === "attendance" && (
            <p className="panel">
              Belgilangan davomat:{" "}
              {display((data.statistics as Record<string, unknown>).percent)}%.
              Kelgan va kechikkanlar barcha belgilangan darslarga bo‘linadi.
              Sababli kelmaganlar maxrajga kiradi.
            </p>
          )}
          {!data.items.length ? (
            <div className="panel empty-state">
              Hozircha bu bo‘limda ma’lumot yo‘q. Ustoz ma’lumot qo‘shganda shu
              yerda ko‘rinadi.
            </div>
          ) : (
            <ScrollTable label={config.title}>
              <table>
                <thead>
                  <tr>
                    {config.columns.map((c) => (
                      <th key={c}>
                        {labels[c] ??
                          (
                            {
                              group_name: "Guruh",
                              due_date: "To‘lov muddati",
                              payable: "To‘lanadigan",
                              change_reason: "O‘zgarish sababi",
                            } as Record<string, string>
                          )[c] ??
                          c}
                      </th>
                    ))}
                    {["assignments", "materials"].includes(section) && (
                      <th>Amal</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row) => (
                    <tr key={row.id}>
                      {config.columns.map((c) => (
                        <td key={c}>{display(row[c], c)}</td>
                      ))}
                      {section === "assignments" && (
                        <td>
                          <button
                            className="button secondary small"
                            onClick={() => setSelected(row.id)}
                          >
                            Ko‘rish / topshirish
                          </button>
                        </td>
                      )}
                      {section === "materials" && (
                        <td>
                          {!!row.media_id && (
                            <a
                              className="button secondary small"
                              href={`/api/v1/media/${row.media_id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Faylni ochish ↗
                            </a>
                          )}
                          {!!row.link && (
                            <a
                              className="button secondary small"
                              href={String(row.link)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Havola ↗
                            </a>
                          )}
                        </td>
                      )}
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
              {page}-sahifa · {data.total} ta
            </span>
            <button
              className="button secondary small"
              disabled={page * 20 >= data.total}
              onClick={() => setPage(page + 1)}
            >
              Keyingi →
            </button>
          </div>
        </>
      )}
      {selected && section === "assignments" && (
        <AssignmentDetail
          key={selected}
          id={selected}
          onClose={() => setSelected("")}
        />
      )}
    </>
  );
}

function Profile() {
  const q = useQuery({
      queryKey: ["student", "profile"],
      queryFn: () => api<Row>("/student/profile"),
    }),
    client = useQueryClient();
  return (
    <>
      <h1>Mening profilim</h1>
      <QueryState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      />
      {q.data && (
        <section className="panel profile-panel">
          <h2>{String(q.data.full_name)}</h2>
          <p className="muted">
            Ism, guruhlar va hisob-kitoblarni ustoz boshqaradi.
          </p>
          <EntityForm
            fields={[
              { name: "phone", label: "Telefon", type: "tel", required: true },
              {
                name: "parent_phone",
                label: "Ota-ona telefoni (ixtiyoriy)",
                type: "tel",
              },
            ]}
            initial={q.data}
            path="/student/profile"
            method="PATCH"
            onSaved={() => {
              void client.invalidateQueries({ queryKey: ["student"] });
            }}
          />
          <Link className="button secondary" href="/change-password">
            Parolni almashtirish
          </Link>
        </section>
      )}
    </>
  );
}

export function StudentWorkspace({ segments }: { segments: string[] }) {
  const section = segments[0] ?? "";
  if (!section) return <StudentDashboard />;
  if (section === "profile") return <Profile />;
  if (section === "certificates") return <StudentCertificates />;
  if (configs[section])
    return (
      <StudentList
        key={section + ":" + (segments[1] ?? "")}
        section={section}
        initialId={segments[1]}
      />
    );
  return (
    <main>
      <h1>Sahifa topilmadi</h1>
      <Link href="/student">Kabinetga qaytish</Link>
    </main>
  );
}

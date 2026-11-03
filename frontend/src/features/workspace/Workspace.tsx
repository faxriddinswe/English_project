"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { api, mutation } from "@/lib/api/client";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ExcelDownload } from "@/components/ui/ExcelDownload";
import { Dialog } from "@/components/ui/Dialog";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { QueryProvider, AuthGate, useSession } from "@/features/auth/Session";
import { ResourceView, QueryState, ActionForm, Summary } from "./ResourceView";
import { EntityForm, today } from "./EntityForm";
import { type Row } from "./config";
import { StudentWorkspace } from "./StudentWorkspace";
import { formatValue } from "@/lib/uz";
import { groupSchedule } from "./group-schedule";
import { PendingStudentsView } from "./PendingStudentsView";
import { TeacherDashboard } from "./TeacherDashboard";
import type { Page } from "@/lib/api/public";

const teacherNav = [
  ["", "Boshqaruv"],
  ["pending-students", "Yangi o‘quvchilar"],
  ["students", "O‘quvchilar"],
  ["groups", "Guruhlar"],
  ["lessons", "Darslar / jadval"],
  ["attendance", "Davomat"],
  ["finance", "Moliya"],
  ["assignments", "Vazifalar"],
  ["results", "Natijalar"],
  ["leads", "Murojaatlar"],
  ["content", "Sayt kontenti"],
  ["reports", "Hisobotlar"],
  ["settings", "Sozlamalar"],
];
const studentNav = [
  ["", "Boshqaruv"],
  ["schedule", "Jadval"],
  ["assignments", "Vazifalar"],
  ["materials", "Materiallar"],
  ["results", "Baholar"],
  ["certificates", "Sertifikatlar"],
  ["attendance", "Davomat"],
  ["billing", "To‘lovlar"],
  ["profile", "Profil"],
];
export function Workspace({
  role,
  segments,
}: {
  role: "teacher" | "student";
  segments: string[];
}) {
  return (
    <QueryProvider>
      <AuthGate role={role}>
        <WorkspaceShell role={role} segments={segments}>
          {role === "teacher" ? (
            <TeacherWorkspace segments={segments} />
          ) : (
            <StudentWorkspace segments={segments} />
          )}
        </WorkspaceShell>
      </AuthGate>
    </QueryProvider>
  );
}
function WorkspaceShell({
  role,
  segments,
  children,
}: {
  role: "teacher" | "student";
  segments: string[];
  children: ReactNode;
}) {
  const user = useSession(),
    client = useQueryClient(),
    router = useRouter();
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const nav = role === "teacher" ? teacherNav : studentNav;
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const close = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  const links = nav.map(([href, label]) => (
    <Link
      key={href}
      className={(segments[0] ?? "") === href ? "active" : ""}
      aria-current={(segments[0] ?? "") === href ? "page" : undefined}
      href={`/${role}/${href}`}
      onClick={() => setMenuOpen(false)}
    >
      {label}
    </Link>
  ));
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <BrandLogo
          size="md"
          href={`/${role}`}
          label="Sherzod English — Kabinet boshqaruvi"
        />
        <button
          ref={menuToggleRef}
          type="button"
          className="button secondary small workspace-menu-toggle"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={() => {
            menuToggleRef.current?.focus();
            setMenuOpen(true);
          }}
        >
          ☰ Menyu
        </button>
        <p className="workspace-role">
          {role === "teacher" ? "USTOZ KABINETI" : "O‘QUVCHI KABINETI"}
        </p>
        <nav aria-label="Kabinet menyusi">{links}</nav>
        <Link className="back-to-site" href="/">
          ↗ Ochiq sayt
        </Link>
      </aside>
      <Dialog
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title="Kabinet menyusi"
        className="workspace-mobile-dialog"
        returnFocusRef={menuToggleRef}
      >
        <h2>Kabinet menyusi</h2>
        <nav className="workspace-mobile-nav" aria-label="Kabinet menyusi">
          {links}
        </nav>
        <Link
          className="button secondary"
          href="/"
          onClick={() => setMenuOpen(false)}
        >
          Ochiq saytga o‘tish ↗
        </Link>
      </Dialog>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <span>{user.username}</span>
          <div>
            <ThemeToggle />
            <Link className="password-link" href="/change-password">
              Parol
            </Link>
            <button
              className="button secondary small"
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                try {
                  await mutation("/auth/logout");
                  client.clear();
                  router.replace("/login");
                  router.refresh();
                } catch (e) {
                  setError((e as Error).message);
                  setLoggingOut(false);
                }
              }}
            >
              {loggingOut ? "Chiqilmoqda…" : "Chiqish"}
            </button>
          </div>
        </header>
        {error && <p className="error-box">{error}</p>}
        <div className="workspace-content">{children}</div>
      </div>
    </div>
  );
}

function GroupOverview() {
  const q = useQuery({
    queryKey: ["teacher", "group-overview"],
    queryFn: ({ signal }) =>
      api<Page<Row>>("/teacher/groups?page_size=20", { signal }),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
  return (
    <section className="panel group-overview">
      <div className="workspace-title">
        <h2>Guruhlar va dars vaqtlari</h2>
        <Link className="button secondary small" href="/teacher/groups">
          Guruhlarni boshqarish
        </Link>
      </div>
      <QueryState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      />
      {q.data &&
        (q.data.items.length ? (
          <div className="group-overview-grid">
            {q.data.items.map((group) => (
              <Link
                key={group.id}
                className="group-overview-card"
                href={`/teacher/groups/${group.id}`}
              >
                <h3>{String(group.name)}</h3>
                <p>{String(group.course_name ?? "")}</p>
                <strong>
                  {String(group.student_count ?? 0)} ta o‘quvchi /{" "}
                  {String(group.capacity)} ta joy
                </strong>
                <p>{groupSchedule(group.rules)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">
            Hozircha guruh yo‘q. Birinchi guruhni yarating.
          </p>
        ))}
    </section>
  );
}

function Finance({ segments }: { segments: string[] }) {
  const search = useSearchParams(),
    [tab, setTab] = useState(
      segments[1] === "payments" ? "payments" : "invoices",
    );
  const client = useQueryClient();
  const student = search.get("student_id");
  const balance = useQuery({
    queryKey: ["teacher", "billing", student],
    queryFn: () =>
      api<Record<string, unknown>>(`/teacher/students/${student}/billing`),
    enabled: !!student,
  });
  const extra = `${student ? `&student_id=${student}` : ""}${search.get("overdue") === "true" ? "&overdue=true" : ""}`;
  return (
    <>
      <div className="workspace-tabs">
        <button
          onClick={() => setTab("invoices")}
          aria-pressed={tab === "invoices"}
        >
          Hisoblar
        </button>
        <button
          onClick={() => setTab("payments")}
          aria-pressed={tab === "payments"}
        >
          To‘lovlar
        </button>
        <Link href="/teacher/finance?overdue=true">Qarzdorlar</Link>
        <ExcelDownload resource="finance">Barcha moliya (Excel)</ExcelDownload>
        <ActionForm
          label="Oylik qoralama hisoblar yaratish"
          path="/teacher/invoices/generate"
          fields={[
            {
              name: "month",
              label: "Oyning istalgan sanasi",
              type: "date",
              required: true,
            },
            {
              name: "group_id",
              label: "Guruh (bo‘sh bo‘lsa barcha)",
              type: "lookup",
              lookup: "groups",
            },
            {
              name: "due_day",
              label: "To‘lov kuni (1–28, bo‘sh bo‘lsa sozlama)",
              type: "number",
            },
          ]}
          transform={(d) => ({ ...d, group_id: d.group_id || null })}
          onSaved={() => {
            void client.invalidateQueries({ queryKey: ["teacher"] });
          }}
          description="Ro‘yxatdagi o‘quvchi va guruhlar uchun to‘liq oylik narx. Oy o‘rtasidagi qo‘shilish/tanaffus uchun qoralamaga qo‘lda summa tuzatishi kiriting, keyin chiqaring."
        />
      </div>
      {balance.data && (
        <div className="panel">
          <h2>O‘quvchi balansi</h2>
          <Summary data={balance.data} />
        </div>
      )}
      <ResourceView
        key={tab + extra + (segments[2] ?? "")}
        name={tab}
        initialId={segments[2]}
        extraQuery={extra}
      />
    </>
  );
}

function Reports() {
  const params = useSearchParams();
  const [month, setMonth] = useState(
    params.get("month") ?? today().slice(0, 7),
  );
  const q = useQuery({
    queryKey: ["teacher", "reports", month],
    queryFn: () =>
      api<Record<string, unknown>>(
        `/teacher/reports/summary?month=${month}-01`,
      ),
  });
  return (
    <>
      <div className="workspace-title">
        <h1>Hisobotlar</h1>
        <input
          aria-label="Hisobot oyi"
          type="month"
          min="0002-01"
          max="9998-12"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>
      <QueryState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      />
      {q.data && (
        <section className="panel">
          <Summary data={q.data} />
        </section>
      )}
      <section className="panel">
        <h2>Excel hisobotlari</h2>
        <p>
          Umumiy ko‘rsatkichlar va oylik moliya tanlangan oy uchun beriladi.
          O‘quvchilar, guruhlar va boshqa batafsil varaqlar barcha yozuvlarni
          qamrab oladi.
        </p>
        <div className="action-buttons">
          <ExcelDownload month={month}>Barcha hisobotlar (Excel)</ExcelDownload>
          {[
            ["finance", "Moliya"],
            ["students", "O‘quvchilar"],
            ["groups", "Guruhlar"],
            ["invoices", "Hisoblar"],
            ["payments", "To‘lovlar"],
            ["pending", "Yangi arizalar"],
            ["leads", "Murojaatlar"],
            ["attendance", "Davomat"],
            ["results", "Baholar"],
          ].map(([key, label]) => (
            <ExcelDownload key={key} resource={key} month={month}>
              {label} (Excel)
            </ExcelDownload>
          ))}
        </div>
      </section>
    </>
  );
}

function Settings() {
  const q = useQuery({
      queryKey: ["teacher", "settings"],
      queryFn: () => api<Record<string, unknown>>("/teacher/settings"),
    }),
    client = useQueryClient();
  return (
    <>
      <h1>Sozlamalar</h1>
      <QueryState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      />
      {q.data && (
        <>
          <section className="panel">
            <h2>Kundalik ish qoidalari</h2>
            <EntityForm
              fields={[
                {
                  name: "absence_threshold",
                  label: "Ketma-ket kelmaslik chegarasi (N)",
                  type: "number",
                  required: true,
                },
                {
                  name: "billing_due_day",
                  label: "Standart to‘lov kuni (1–28)",
                  type: "number",
                  required: true,
                },
              ]}
              initial={q.data}
              path="/teacher/settings"
              method="PUT"
              onSaved={() => {
                void client.invalidateQueries({ queryKey: ["teacher"] });
              }}
            />
          </section>
          <section className="panel">
            <h2>Integratsiyalar</h2>
            <p>
              Telegram:{" "}
              {q.data.telegram_configured
                ? "Sozlangan"
                : "Sozlanmagan — arizalar saqlanadi, xabar yuborilmaydi"}
            </p>
            <p>
              Fayl ombori:{" "}
              {formatValue(q.data.storage_backend, "storage_backend")} · Vaqt:
              Toshkent vaqti
            </p>
            <p className="muted">
              Ulanish kalitlari sayt egasi tomonidan alohida sozlanadi.
            </p>
            <Link href="/change-password">Parolni almashtirish →</Link>
          </section>
        </>
      )}
    </>
  );
}

export function TeacherWorkspace({ segments }: { segments: string[] }) {
  const section = segments[0] ?? "";
  if (!section) return <TeacherDashboard groupOverview={<GroupOverview />} />;
  if (section === "pending-students") return <PendingStudentsView />;
  if (section === "finance") return <Finance segments={segments} />;
  if (section === "reports") return <Reports />;
  if (section === "settings") return <Settings />;
  if (section === "results")
    return (
      <>
        <div className="workspace-tabs">
          <Link href="/teacher/results">Ommaviy sertifikatlar</Link>
          <Link href="/teacher/assessments">Ichki baholar</Link>
        </div>
        <ResourceView name="certificates" initialId={segments[1]} />
      </>
    );
  if (section === "assignments")
    return (
      <>
        <div className="workspace-tabs">
          <Link href="/teacher/assignments">Vazifalar</Link>
          <Link href="/teacher/materials">Materiallar</Link>
        </div>
        <ResourceView
          key={"assignments:" + (segments[1] ?? "")}
          name="assignments"
          initialId={segments[1]}
        />
      </>
    );
  if (section === "content")
    return (
      <>
        <div className="workspace-tabs">
          <Link href="/teacher/content">Sayt bo‘limlari</Link>
          <Link href="/teacher/courses">Kurslar</Link>
          <Link href="/" target="_blank">
            Nashr qilingan sayt ↗
          </Link>
        </div>
        <ResourceView
          key={"content:" + (segments[1] ?? "")}
          name="content"
          initialId={segments[1]}
        />
      </>
    );
  if (
    [
      "students",
      "groups",
      "lessons",
      "attendance",
      "leads",
      "assessments",
      "materials",
      "courses",
    ].includes(section)
  )
    return (
      <ResourceView
        key={section + ":" + (segments[1] ?? "")}
        name={section}
        initialId={segments[1]}
      />
    );
  return (
    <div className="empty-state">
      <h1>Sahifa topilmadi</h1>
      <Link href="/teacher">Boshqaruvga qaytish</Link>
    </div>
  );
}

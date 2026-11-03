"use client";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ExcelDownload } from "@/components/ui/ExcelDownload";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  RefreshCw,
  Users,
  Wallet,
  WifiOff,
} from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import { WORKSPACE_UPDATES_CHANNEL } from "@/lib/workspace-updates";
import { QueryState } from "./ResourceView";
import { today } from "./EntityForm";
import {
  changeMonth,
  money,
  monthLabel,
  receiptComparison,
  shortMoney,
} from "./dashboard-format";
import {
  DonutChart,
  EmptyChart,
  FinanceChart,
  RegistrationBars,
  Sparkline,
} from "./dashboard-charts";
import type { ChartSlice, DashboardData } from "./dashboard-types";
import styles from "./TeacherDashboard.module.css";

const COLORS = {
  teal: "var(--chart-teal)",
  purple: "var(--chart-purple)",
  gold: "var(--chart-gold)",
  coral: "var(--chart-coral)",
  gray: "var(--chart-gray)",
};
const studentKinds: Record<string, [string, string]> = {
  assigned: ["Guruhga biriktirilgan", COLORS.teal],
  unassigned: ["Guruhga qo‘shilmagan", COLORS.purple],
};
const attendanceKinds: Record<string, [string, string]> = {
  present: ["Kelgan", COLORS.teal],
  late: ["Kechikkan", COLORS.gold],
  absent: ["Kelmagan", COLORS.coral],
  excused: ["Sababli", COLORS.purple],
};
function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
const onlineSnapshot = () => navigator.onLine;
const serverOnline = () => true;

function Panel({
  title,
  subtitle,
  children,
  className = "",
  action,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <section className={`${styles.panel} ${className}`} aria-label={title}>
      <header className={styles.panelHeader}>
        <div>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function TeacherDashboard({
  groupOverview,
}: {
  groupOverview?: ReactNode;
}) {
  const [month, setMonth] = useState(today().slice(0, 7));
  const [financeMode, setFinanceMode] = useState<"daily" | "monthly">("daily");
  const online = useSyncExternalStore(
    subscribeOnline,
    onlineSnapshot,
    serverOnline,
  );
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["teacher", "dashboard", month],
    queryFn: ({ signal }) =>
      api<DashboardData>(`/teacher/dashboard?month=${month}-01`, { signal }),
    refetchInterval: (query) =>
      query.state.error instanceof ApiError &&
      [401, 403].includes(query.state.error.status)
        ? false
        : 5000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(WORKSPACE_UPDATES_CHANNEL);
    channel.onmessage = () => {
      void client.invalidateQueries({ queryKey: ["teacher", "dashboard"] });
      void client.invalidateQueries({
        queryKey: ["teacher", "group-overview"],
      });
    };
    return () => channel.close();
  }, [client]);
  const data = q.data;
  const analytics = data?.analytics;
  const monthly = analytics?.monthly ?? [];
  const comparison = data
    ? receiptComparison(
        String(data.net_receipts ?? "0.00"),
        monthly.at(-2)?.net,
      )
    : null;
  const studentSlices: ChartSlice[] = (analytics?.student_groups ?? []).map(
    (slice) => ({
      key: slice.kind,
      label: studentKinds[slice.kind]?.[0] ?? slice.kind,
      color: studentKinds[slice.kind]?.[1] ?? COLORS.gray,
      value: slice.count,
    }),
  );
  const attendanceSlices: ChartSlice[] = (analytics?.attendance ?? []).map(
    (slice) => ({
      key: slice.status,
      label: attendanceKinds[slice.status]?.[0] ?? slice.status,
      color: attendanceKinds[slice.status]?.[1] ?? COLORS.gray,
      value: slice.count,
    }),
  );
  const methodLabels: Record<string, string> = {
    cash: "Naqd pul",
    bank_transfer: "Bank o‘tkazmasi",
    other: "Boshqa",
  };
  const methodSlices: ChartSlice[] = (analytics?.payment_methods ?? []).map(
    (slice, index) => ({
      key: slice.method,
      label: methodLabels[slice.method] ?? slice.method,
      value: Number(slice.amount),
      display: money(slice.amount),
      color: [COLORS.teal, COLORS.purple, COLORS.gold][index % 3],
    }),
  );
  const leadLabels: Record<string, string> = {
    new: "Yangi",
    contacted: "Bog‘lanilgan",
    converted: "O‘quvchiga aylangan",
    closed: "Yopilgan",
  };
  const leadTotal =
    analytics?.lead_status.reduce((sum, row) => sum + row.count, 0) ?? 0;
  const syncTime = q.dataUpdatedAt
    ? new Intl.DateTimeFormat("uz-UZ", {
        timeZone: "Asia/Tashkent",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(q.dataUpdatedAt)
    : "—";
  return (
    <div className={styles.dashboard}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            SHERZOD ENGLISH · TAHLIL MARKAZI
          </span>
          <h1>Boshqaruv</h1>
          <p>Ta’lim jarayoni va moliyaviy holat — bir qarashda.</p>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.monthPicker}>
            <button
              type="button"
              aria-label="Oldingi oy"
              onClick={() => setMonth(changeMonth(month, -1))}
            >
              <ChevronLeft size={17} />
            </button>
            <label>
              <CalendarDays size={16} />
              <span className="sr-only">Hisobot oyi</span>
              <input
                aria-label="Hisobot oyi"
                type="month"
                min="0002-01"
                max="9998-12"
                value={month}
                onChange={(event) => {
                  if (/^\d{4}-\d{2}$/.test(event.target.value))
                    setMonth(event.target.value);
                }}
              />
            </label>
            <button
              type="button"
              aria-label="Keyingi oy"
              onClick={() => setMonth(changeMonth(month, 1))}
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <button
            type="button"
            className={styles.refresh}
            aria-label="Ma’lumotlarni yangilash"
            title="Ma’lumotlarni yangilash"
            disabled={q.isFetching || !online}
            onClick={() => {
              void q.refetch();
              void client.invalidateQueries({
                queryKey: ["teacher", "group-overview"],
              });
            }}
          >
            <RefreshCw
              size={17}
              className={q.isFetching ? styles.spinning : ""}
            />
          </button>
        </div>
      </div>
      <div className="dashboard-export">
        <ExcelDownload month={month}>Barcha hisobotlar (Excel)</ExcelDownload>
      </div>
      <div className={styles.syncRow}>
        <span
          className={`${styles.live} ${!online || q.isError ? styles.disconnected : ""}`}
        >
          {!online ? <WifiOff size={13} /> : <i />}
          {!online
            ? "Internet aloqasi yo‘q"
            : q.isError
              ? "Yangilanish vaqtincha to‘xtadi"
              : q.isPending
                ? "Ma’lumotlar yuklanmoqda"
                : "Jonli yangilanish"}
        </span>
        <span>
          {q.dataUpdatedAt
            ? `Oxirgi yangilanish ${syncTime}`
            : "Server bilan bog‘lanmoqda…"}
          <b aria-hidden="true">·</b>Toshkent vaqti<b aria-hidden="true">·</b>5
          soniyada yangilanadi
        </span>
      </div>
      <QueryState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      />
      {data && (
        <>
          <div className={styles.metricGrid}>
            <Link
              href="/teacher/students"
              className={`${styles.metric} metric-card`}
            >
              <div className={styles.metricTop}>
                <span className={styles.metricIcon}>
                  <Users size={19} />
                </span>
                <ArrowUpRight size={16} />
              </div>
              <span>O‘quvchilar soni</span>
              <strong data-testid="dashboard-students">
                {data.student_count}
              </strong>
              <div className={styles.metricFoot}>
                <small>
                  {data.pending_students ?? 0} ta ariza tasdiq kutmoqda
                </small>
                <Sparkline values={monthly.map((p) => p.registrations ?? 0)} />
              </div>
            </Link>
            <Link
              href="/teacher/groups"
              className={`${styles.metric} metric-card`}
            >
              <div className={styles.metricTop}>
                <span className={`${styles.metricIcon} ${styles.purple}`}>
                  <GraduationCap size={19} />
                </span>
                <ArrowUpRight size={16} />
              </div>
              <span>Guruhlar soni</span>
              <strong>{data.group_count}</strong>
              <div className={styles.metricFoot}>
                <small>
                  {analytics
                    ? `${analytics.group_totals.occupied} / ${analytics.group_totals.capacity} ta joy band`
                    : "Amaldagi guruhlar"}
                </small>
                <div className={styles.miniBars} aria-hidden="true">
                  {(analytics?.groups ?? []).slice(0, 6).map((group) => (
                    <span
                      key={group.id}
                      style={{
                        height: `${Math.min(100, (group.students / group.capacity) * 100)}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </Link>
            <Link
              href={`/teacher/reports?month=${month}`}
              className={`${styles.metric} ${styles.financeMetric} metric-card`}
            >
              <div className={styles.metricTop}>
                <span className={styles.metricIcon}>
                  <Wallet size={19} />
                </span>
                <ArrowUpRight size={16} />
              </div>
              <span>Qaytarishdan keyingi tushum</span>
              <strong data-testid="dashboard-net">
                {money(data.net_receipts)}
              </strong>
              <div className={styles.metricFoot}>
                <small
                  className={
                    comparison && comparison.direction > 0
                      ? styles.positive
                      : comparison && comparison.direction < 0
                        ? styles.negative
                        : ""
                  }
                >
                  {comparison?.text}
                </small>
              </div>
            </Link>
            <Link
              href="/teacher/finance?overdue=true"
              className={`${styles.metric} metric-card`}
            >
              <div className={styles.metricTop}>
                <span className={`${styles.metricIcon} ${styles.coral}`}>
                  <CircleDollarSign size={19} />
                </span>
                <ArrowUpRight size={16} />
              </div>
              <span>Muddati o‘tgan qarz</span>
              <strong>{money(data.overdue)}</strong>
              <div className={styles.metricFoot}>
                <small>Hozirgi holat · o‘tgan muddatli hisoblar</small>
              </div>
            </Link>
          </div>
          <div className={styles.chartGrid}>
            <Panel
              title="Pul oqimi"
              subtitle={`${monthLabel(month)} · so‘mda`}
              className={styles.financePanel}
              eyebrow="MOLIYAVIY KO‘RINISH"
              action={
                <div className={styles.segmented} aria-label="Grafik davri">
                  <button
                    type="button"
                    aria-pressed={financeMode === "daily"}
                    onClick={() => setFinanceMode("daily")}
                  >
                    Kunlik
                  </button>
                  <button
                    type="button"
                    aria-pressed={financeMode === "monthly"}
                    onClick={() => setFinanceMode("monthly")}
                  >
                    6 oylik
                  </button>
                </div>
              }
            >
              <div className={styles.financeNumbers}>
                <div>
                  <span>
                    <ArrowDownLeft size={14} />
                    Olingan pul
                  </span>
                  <strong>{money(data.received)}</strong>
                </div>
                <div>
                  <span>
                    <ArrowUpRight size={14} />
                    Qaytarilgan pul
                  </span>
                  <strong>{money(data.refunded)}</strong>
                </div>
              </div>
              <FinanceChart
                key={`${month}-${financeMode}`}
                points={
                  financeMode === "daily"
                    ? (analytics?.daily_finance ?? [])
                    : monthly
                }
                monthly={financeMode === "monthly"}
              />
              <p className={styles.note}>
                To‘lov sanalari bo‘yicha. Qaytarishdan keyingi tushum — foyda
                hisoboti emas.
              </p>
            </Panel>
            <Panel
              title="Guruhlarga biriktirish"
              subtitle="O‘quvchilarning guruhlarga biriktirilishi"
              eyebrow="TA’LIM OLUVCHILAR"
            >
              <DonutChart
                slices={studentSlices}
                label="O‘quvchilarni guruhlarga biriktirish diagrammasi"
                totalDisplay={String(analytics?.student_total ?? "—")}
                totalLabel="jami o‘quvchi"
              />
              <Link className={styles.panelLink} href="/teacher/students">
                O‘quvchilarni ko‘rish
                <ArrowRight size={15} />
              </Link>
            </Panel>
            <Panel
              title="Guruhlar bandligi"
              subtitle="Guruhlar sonidagi amaldagi a’zoliklar"
              action={
                <Link
                  className={styles.iconLink}
                  href="/teacher/groups"
                  aria-label="Barcha guruhlar"
                >
                  <ArrowUpRight size={18} />
                </Link>
              }
            >
              {analytics?.groups.length ? (
                <>
                  <div className={styles.occupancySummary}>
                    <strong>
                      {analytics.group_totals.occupied}
                      <small>
                        {" "}
                        / {analytics.group_totals.capacity} joy band
                      </small>
                    </strong>
                    <span>{analytics.group_totals.groups} ta guruh</span>
                  </div>
                  <div className={styles.groupBars}>
                    {analytics.groups.map((group) => (
                      <Link
                        key={group.id}
                        href={`/teacher/groups/${group.id}`}
                        className={styles.groupBar}
                      >
                        <div>
                          <span>
                            <strong>{group.name}</strong>
                            <small>{group.course_name}</small>
                          </span>
                          <b>
                            {group.students}
                            <small> / {group.capacity}</small>
                          </b>
                        </div>
                        <div
                          className={styles.capacityTrack}
                          role="meter"
                          aria-label={`${group.name} bandligi`}
                          aria-valuemin={0}
                          aria-valuemax={Math.max(
                            group.capacity,
                            group.students,
                          )}
                          aria-valuenow={group.students}
                          aria-valuetext={`${group.students} a’zo, ${group.capacity} joy`}
                        >
                          <span
                            style={{
                              width: `${Math.min(100, (group.students / group.capacity) * 100)}%`,
                              background:
                                group.students > group.capacity
                                  ? COLORS.coral
                                  : COLORS.purple,
                            }}
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                  {analytics.group_totals.groups > 8 && (
                    <p className={styles.note}>
                      A’zolar soni bo‘yicha dastlabki 8 guruh. Barcha guruhlar
                      jami yuqorida.
                    </p>
                  )}
                </>
              ) : (
                <EmptyChart text="Hozircha guruh yo‘q" />
              )}
            </Panel>
            <Panel
              title="Ro‘yxatdan o‘tishlar"
              subtitle="So‘nggi 6 oy · yaratilgan o‘quvchi profillari"
            >
              <RegistrationBars points={monthly} />
            </Panel>
            <Panel
              title="Davomat ko‘rinishi"
              subtitle={`${monthLabel(month)} · belgilangan davomat`}
            >
              <DonutChart
                slices={attendanceSlices}
                label="Davomat holatlari diagrammasi"
                totalDisplay={
                  data.attendance_percent === null ||
                  data.attendance_percent === undefined
                    ? "—"
                    : `${data.attendance_percent}%`
                }
                totalLabel="qatnashgan"
              />
              <div className={styles.attendanceFoot}>
                <span>
                  <CheckCircle2 size={15} />
                  {data.marked_attendance ?? 0} ta belgilangan
                </span>
                <Link href={`/teacher/attendance?unmarked=true&month=${month}`}>
                  <Clock3 size={15} />
                  {data.unmarked_attendance ?? 0} ta belgilanmagan
                </Link>
              </div>
              <p className={styles.note}>
                Foiz: kelgan + kechikkan / barcha belgilanganlar. Sababli
                kelmaganlar ham maxrajga kiradi.
              </p>
            </Panel>
            <Panel
              title="To‘lov usullari"
              subtitle={`${monthLabel(month)} · olingan pul taqsimoti`}
            >
              <DonutChart
                slices={methodSlices}
                label="To‘lov usullari"
                totalDisplay={shortMoney(Number(data.received))}
                totalLabel="so‘m olingan"
              />
              <Link
                className={styles.panelLink}
                href={`/teacher/finance/payments?month=${month}`}
              >
                To‘lovlar tarixini ko‘rish
                <ArrowRight size={15} />
              </Link>
            </Panel>
          </div>
          <div className={styles.operations}>
            <Panel
              title="Bugungi e’tibor"
              subtitle="Muhim ishlarni shu yerdan davom ettiring"
            >
              <div className={styles.quickStats}>
                <Link href="/teacher/lessons?today=true">
                  <CalendarDays size={18} />
                  <strong>{data.today_lessons}</strong>
                  <span>bugungi dars</span>
                  <ArrowRight size={15} />
                </Link>
                <Link href="/teacher/pending-students">
                  <Users size={18} />
                  <strong>{data.pending_students ?? 0}</strong>
                  <span>yangi ariza</span>
                  <ArrowRight size={15} />
                </Link>
                <Link href="/teacher/leads?status=new">
                  <Clock3 size={18} />
                  <strong>{data.new_leads}</strong>
                  <span>yangi murojaat</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
              {data.attention?.map((item) => (
                <Link
                  key={item.href}
                  className={styles.attentionLink}
                  href={item.href}
                >
                  {item.label}
                  <ArrowUpRight size={15} />
                </Link>
              ))}
            </Panel>
            <Panel
              title="Murojaatlar holati"
              subtitle="Hozirgi barcha murojaatlar"
            >
              <div className={styles.leadBars}>
                {analytics?.lead_status.length ? (
                  analytics.lead_status.map((lead, i) => (
                    <div key={lead.status}>
                      <div>
                        <span>{leadLabels[lead.status] ?? lead.status}</span>
                        <strong>{lead.count}</strong>
                      </div>
                      <span className={styles.leadTrack}>
                        <i
                          style={{
                            width: `${leadTotal ? (lead.count / leadTotal) * 100 : 0}%`,
                            background: [
                              COLORS.purple,
                              COLORS.gold,
                              COLORS.teal,
                              COLORS.gray,
                            ][i % 4],
                          }}
                        />
                      </span>
                    </div>
                  ))
                ) : (
                  <EmptyChart text="Hozircha murojaatlar yo‘q" />
                )}
              </div>
              <div className={styles.absenceNote}>
                <h3>
                  Ketma-ket {data.absence_threshold ?? 2} marta kelmaganlar
                </h3>
                {data.consecutive_absences?.length ? (
                  data.consecutive_absences.map((student) => (
                    <Link
                      className={styles.attentionLink}
                      key={student.id}
                      href={`/teacher/students/${student.id}`}
                    >
                      {student.full_name}
                      <ArrowUpRight size={15} />
                    </Link>
                  ))
                ) : (
                  <p>Hozircha bunday o‘quvchi yo‘q.</p>
                )}
              </div>
            </Panel>
          </div>
          <div className={styles.groupOverview}>{groupOverview}</div>
          {!data.telegram_configured && (
            <div className="panel integration-note">
              <h2>Telegram sozlanmagan</h2>
              <p>
                Arizalar bazada saqlanadi. Bot sozlangach, murojaat tafsilotida
                qayta yuborishni tanlash mumkin.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

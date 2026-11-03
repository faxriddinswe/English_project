"use client";
import { useEffect, useId, useRef, useState } from "react";
import { monthLabel, money, shortMoney } from "./dashboard-format";
import type { ChartSlice, FinancePoint } from "./dashboard-types";
import styles from "./TeacherDashboard.module.css";

const number = (value: unknown) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

export function EmptyChart({
  text = "Hozircha ma’lumot yo‘q",
}: {
  text?: string;
}) {
  return (
    <div className={styles.emptyChart}>
      <span aria-hidden="true">◌</span>
      <p>{text}</p>
      <small>Ma’lumot qo‘shilganda grafik shu yerda ko‘rinadi.</small>
    </div>
  );
}

export function Sparkline({
  values,
  color = "var(--chart-teal)",
}: {
  values: number[];
  color?: string;
}) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const points = values
    .map(
      (v, i) =>
        `${(i * 100) / Math.max(1, values.length - 1)},${30 - (v / max) * 26}`,
    )
    .join(" ");
  return (
    <svg viewBox="0 0 100 34" className={styles.sparkline} aria-hidden="true">
      <title>6 oylik ro‘yxatdan o‘tishlar</title>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function FinanceChart({
  points,
  monthly,
}: {
  points: FinancePoint[];
  monthly: boolean;
}) {
  const gradient = useId().replace(/:/g, "");
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(780);
  useEffect(() => {
    if (!svgRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry)
        setCanvasWidth(
          Math.max(240, Math.min(780, Math.round(entry.contentRect.width))),
        );
    });
    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, [points.length]);
  if (!points.length) return <EmptyChart />;
  const width = canvasWidth,
    height = 250,
    left = 60,
    right = 16,
    top = 20,
    bottom = 30;
  const plotWidth = width - left - right,
    plotHeight = height - top - bottom;
  const max =
    Math.max(
      ...points.flatMap((p) => [number(p.received), number(p.refunded)]),
      1,
    ) * 1.15;
  const x = (index: number) =>
    left + (index / Math.max(1, points.length - 1)) * plotWidth;
  const y = (amount: number) => top + plotHeight - (amount / max) * plotHeight;
  const visible = points
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.observed !== false);
  const last = visible.at(-1)?.i ?? 0;
  const chosen = Math.max(0, Math.min(points.length - 1, active ?? last));
  const point = points[chosen];
  const line = (key: "received" | "refunded") =>
    visible
      .map(({ p, i }, n) => `${n ? "L" : "M"}${x(i)},${y(number(p[key]))}`)
      .join(" ");
  const receivedPath = line("received");
  const area = visible.length
    ? `${receivedPath} L${x(last)},${y(0)} L${x(visible[0].i)},${y(0)} Z`
    : "";
  const label = (p: FinancePoint) =>
    monthly ? monthLabel(p.date) : `${p.date.slice(8)} ${monthLabel(p.date)}`;
  return (
    <>
      <div
        className={styles.chartReadout}
        aria-live="polite"
        aria-atomic="true"
      >
        <span>
          {label(point)}
          {point.observed === false ? " · Kelgusi sana" : ""}
        </span>
        {point.observed !== false && (
          <div>
            <strong>{money(point.received)}</strong>
            <small>olingan · {money(point.refunded)} qaytarilgan</small>
          </div>
        )}
      </div>
      <svg
        ref={svgRef}
        className={styles.financeSvg}
        style={{ aspectRatio: `${width} / ${height}` }}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Tushum va qaytarishlar chiziqli grafigi"
        aria-describedby={`${gradient}-hint`}
        tabIndex={0}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const relative = ((event.clientX - rect.left) / rect.width) * width;
          setActive(
            Math.round(
              Math.max(0, Math.min(1, (relative - left) / plotWidth)) *
                (points.length - 1),
            ),
          );
        }}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          setActive(
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? points.length - 1
                : Math.max(
                    0,
                    Math.min(
                      points.length - 1,
                      chosen + (event.key === "ArrowLeft" ? -1 : 1),
                    ),
                  ),
          );
        }}
      >
        <title>
          Kunlar bo‘yicha olingan pul va qaytarishlar. Qiymatlar so‘mda.
        </title>
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-teal)" stopOpacity=".24" />
            <stop
              offset="100%"
              stopColor="var(--chart-teal)"
              stopOpacity=".01"
            />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((step) => (
          <g key={step}>
            <line
              x1={left}
              x2={width - right}
              y1={y((max * step) / 4)}
              y2={y((max * step) / 4)}
              className={styles.gridLine}
            />
            <text
              x={left - 10}
              y={y((max * step) / 4) + 4}
              textAnchor="end"
              className={styles.axisLabel}
            >
              {shortMoney((max * step) / 4)}
            </text>
          </g>
        ))}
        {points.map(
          (p, i) =>
            (monthly || i === 0 || i === points.length - 1 || i % 5 === 0) && (
              <text
                key={p.date}
                x={x(i)}
                y={height - 5}
                textAnchor="middle"
                className={styles.axisLabel}
              >
                {monthly ? monthLabel(p.date).slice(0, 3) : p.date.slice(8)}
              </text>
            ),
        )}
        <path d={area} fill={`url(#${gradient})`} />
        <path
          d={receivedPath}
          fill="none"
          stroke="var(--chart-teal)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={line("refunded")}
          fill="none"
          stroke="var(--chart-coral)"
          strokeWidth="2"
          strokeDasharray="5 5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {point.observed !== false && (
          <>
            <line
              x1={x(chosen)}
              x2={x(chosen)}
              y1={top}
              y2={y(0)}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
            <circle
              cx={x(chosen)}
              cy={y(number(point.received))}
              r="6"
              fill="var(--chart-teal)"
              stroke="var(--surface)"
              strokeWidth="3"
            />
            <circle
              cx={x(chosen)}
              cy={y(number(point.refunded))}
              r="4"
              fill="var(--chart-coral)"
            />
          </>
        )}
      </svg>
      <div className={styles.chartLegend}>
        <span>
          <i style={{ background: "var(--chart-teal)" }} />
          Olingan pul
        </span>
        <span>
          <i style={{ background: "var(--chart-coral)" }} />
          Qaytarilgan pul
        </span>
      </div>
      <p id={`${gradient}-hint`} className={styles.chartHint}>
        Kun ustiga bosing yoki grafikda ← → tugmalarini ishlating.
      </p>
      <details className={styles.dataDetails}>
        <summary>Grafik ma’lumotlarini jadvalda ko‘rish</summary>
        <div className={styles.dataTable}>
          <table>
            <caption className="sr-only">Tushum va qaytarishlar</caption>
            <thead>
              <tr>
                <th>Sana</th>
                <th>Olingan pul</th>
                <th>Qaytarilgan</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date}>
                  <td>{p.date}</td>
                  <td>
                    {p.observed === false ? "Kelgusi sana" : money(p.received)}
                  </td>
                  <td>{p.observed === false ? "—" : money(p.refunded)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

export function DonutChart({
  slices,
  totalLabel,
  totalDisplay,
  label,
}: {
  slices: ChartSlice[];
  totalLabel: string;
  totalDisplay: string;
  label: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const total = slices.reduce(
    (sum, slice) => sum + Math.max(0, slice.value),
    0,
  );
  if (!total)
    return (
      <EmptyChart
        text={
          label === "To‘lov usullari"
            ? "Bu oyda to‘lov qayd etilmagan"
            : "Hozircha ma’lumot yo‘q"
        }
      />
    );
  const radius = 72,
    circumference = 2 * Math.PI * radius;
  return (
    <div className={styles.donutLayout}>
      <div className={styles.donutFigure}>
        <svg viewBox="0 0 200 200" role="img" aria-label={label}>
          <title>
            {label}: {totalDisplay} {totalLabel}
          </title>
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="19"
          />
          {slices.map((slice, index) => {
            const length = (Math.max(0, slice.value) / total) * circumference;
            const start =
              (slices
                .slice(0, index)
                .reduce((sum, prior) => sum + Math.max(0, prior.value), 0) /
                total) *
              circumference;
            return (
              length > 0 && (
                <circle
                  key={slice.key}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={active === slice.key ? "23" : "19"}
                  strokeDasharray={`${Math.max(0, length - (length < circumference ? 3 : 0))} ${circumference}`}
                  strokeDashoffset={-start}
                  transform="rotate(-90 100 100)"
                  className={styles.donutSegment}
                  opacity={active && active !== slice.key ? 0.3 : 1}
                />
              )
            );
          })}
        </svg>
        <div className={styles.donutCenter}>
          <strong>{totalDisplay}</strong>
          <span>{totalLabel}</span>
        </div>
      </div>
      <ul className={styles.donutLegend}>
        {slices.map((slice) => (
          <li key={slice.key}>
            <button
              type="button"
              onClick={() => setActive(slice.key)}
              onMouseEnter={() => setActive(slice.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(slice.key)}
              onBlur={() => setActive(null)}
              aria-pressed={active === slice.key}
              aria-label={`${slice.label}: ${slice.display ?? slice.value}, ${((slice.value / total) * 100).toFixed(1)}%`}
            >
              <i style={{ background: slice.color }} />
              <span>
                {slice.label}
                <small>
                  {((slice.value / total) * 100).toLocaleString("uz-UZ", {
                    maximumFractionDigits: 1,
                  })}
                  %
                </small>
              </span>
              <strong>{slice.display ?? slice.value}</strong>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RegistrationBars({ points }: { points: FinancePoint[] }) {
  const [active, setActive] = useState<string | null>(null);
  if (!points.length) return <EmptyChart />;
  const max = Math.max(1, ...points.map((p) => p.registrations ?? 0));
  const chosen = points.find((p) => p.date === active) ?? points.at(-1)!;
  return (
    <>
      <div className={styles.barSummary}>
        <span>{monthLabel(chosen.date)}</span>
        <strong>
          {chosen.registrations ?? 0}
          <small> ta yangi ro‘yxat</small>
        </strong>
      </div>
      <div
        className={styles.registrationBars}
        role="group"
        aria-label="Oylik ro‘yxatdan o‘tishlar ustunli diagrammasi"
      >
        {points.map((point, index) => (
          <button
            type="button"
            key={point.date}
            onClick={() => setActive(point.date)}
            onFocus={() => setActive(point.date)}
            onMouseEnter={() => setActive(point.date)}
            aria-label={`${monthLabel(point.date)}: ${point.registrations ?? 0} ta ro‘yxatdan o‘tish`}
            aria-pressed={chosen.date === point.date}
          >
            <span className={styles.barValue}>{point.registrations ?? 0}</span>
            <span className={styles.barTrack}>
              <span
                style={{
                  height: `${((point.registrations ?? 0) / max) * 100}%`,
                  background:
                    index === points.length - 1
                      ? "var(--chart-purple)"
                      : "var(--chart-purple-soft)",
                }}
              />
            </span>
            <span className={styles.barLabel}>
              {monthLabel(point.date).slice(0, 3)}
            </span>
          </button>
        ))}
      </div>
      <p className={styles.chartHint}>
        Yaratilgan profillar soni. Kutayotgan arizalar ham kiradi.
      </p>
    </>
  );
}

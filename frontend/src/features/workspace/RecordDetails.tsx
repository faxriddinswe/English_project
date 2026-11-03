"use client";
import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, History, Settings2, Pencil, Wallet } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatValue } from "@/lib/uz";
import type { Row } from "./config";
import { Summary } from "./RecordSummary";
import { ResourceActions, RecordHistory } from "./ResourceActions";
import styles from "./RecordDetails.module.css";

export function RecordDetails({
  name,
  title,
  row,
  canEdit,
  onEdit,
  onSaved,
  onDeleted,
}: {
  name: string;
  title: string;
  row: Row;
  canEdit: boolean;
  onEdit: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [tab, setTab] = useState("info");
  const id = useId();
  const label = String(row.full_name ?? row.name ?? row.title ?? title);
  const history = ["students", "groups"].includes(name);
  const tabs = [
    { key: "info", label: "Ma’lumotlar", icon: FileText },
    ...(history
      ? [
          {
            key: "history",
            label: name === "groups" ? "A’zolar" : "O‘quv tarixi",
            icon: History,
          },
        ]
      : []),
    { key: "actions", label: "Boshqaruv", icon: Settings2 },
  ];
  const billing = useQuery({
    queryKey: ["teacher", "record-billing", row.id],
    queryFn: () => api<Row>(`/teacher/students/${row.id}/billing`),
    enabled: name === "students" && tab === "info",
  });
  const data = Object.fromEntries(
    Object.entries(row).filter(
      ([key]) => !["full_name", "name", "title"].includes(key),
    ),
  );
  return (
    <div className={styles.details}>
      <header className={styles.header}>
        <div className={styles.avatar} aria-hidden="true">
          {label
            .split(/\s+/)
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase()}
        </div>
        <div className={styles.identity}>
          <p>{title}</p>
          <h2>{label}</h2>
          {row.phone ? (
            <a href={`tel:${row.phone}`}>{String(row.phone)}</a>
          ) : null}
        </div>
        {canEdit && (
          <button className="button secondary small" onClick={onEdit}>
            <Pencil size={15} aria-hidden="true" />
            Tahrirlash
          </button>
        )}
      </header>
      <div className={styles.tabs} role="tablist" aria-label="Yozuv bo‘limlari">
        {tabs.map(({ key, label: text, icon: Icon }, index) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${id}-${key}`}
            aria-controls={`${id}-panel`}
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (index + tabs.length - 1) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : -1;
              if (next >= 0) {
                event.preventDefault();
                setTab(tabs[next].key);
                document.getElementById(`${id}-${tabs[next].key}`)?.focus();
              }
            }}
          >
            <Icon size={16} aria-hidden="true" />
            {text}
          </button>
        ))}
      </div>
      <div
        className={styles.body}
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${tab}`}
        tabIndex={0}
      >
        {row.deleted_at ? (
          <p className={styles.notice}>
            Yozuv o‘chirilgan. Oldingi ta’lim va moliyaviy tarix saqlangan.
          </p>
        ) : null}
        {tab === "info" && (
          <>
            {name === "students" && (
              <section
                className={styles.balance}
                aria-label="O‘quvchi moliyasi"
              >
                {billing.isPending ? (
                  <p className="muted">Balans yuklanmoqda…</p>
                ) : billing.isError ? (
                  <button
                    className="button secondary small"
                    onClick={() => billing.refetch()}
                  >
                    Balansni qayta yuklash
                  </button>
                ) : (
                  billing.data &&
                  [
                    ["debt", "Jami qarz"],
                    ["overdue", "Muddati o‘tgan"],
                    ["unallocated_credit", "Erkin mablag‘"],
                  ].map(([key, text]) => (
                    <div key={key}>
                      <span>
                        <Wallet size={15} aria-hidden="true" />
                        {text}
                      </span>
                      <strong>{formatValue(billing.data[key], key)}</strong>
                    </div>
                  ))
                )}
              </section>
            )}
            <section className={styles.card}>
              <h3>Asosiy ma’lumotlar</h3>
              <Summary data={data} className={styles.summary} />
            </section>
            {name === "students" && (
              <p className={styles.hint}>
                Davomat, baholar va a’zoliklar “O‘quv tarixi”da. Guruhga
                qo‘shish va boshqa amallar “Boshqaruv”da.
              </p>
            )}
          </>
        )}
        {tab === "history" && (
          <section className={styles.card}>
            <RecordHistory name={name} row={row} onSaved={onSaved} />
          </section>
        )}
        {tab === "actions" && (
          <section className={styles.card}>
            <h3>Amallar</h3>
            <p className={styles.hint}>
              Kerakli amalni tanlang. O‘zgartirishni tasdiqlashdan oldin
              ma’lumotlarni tekshiring.
            </p>
            <ResourceActions
              name={name}
              row={row}
              onSaved={onSaved}
              onDeleted={onDeleted}
            />
          </section>
        )}
      </div>
    </div>
  );
}

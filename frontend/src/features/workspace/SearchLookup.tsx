"use client";
import { useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { localizeText } from "@/lib/uz";
import { formatMoney } from "@/lib/utils/money";
import type { Page } from "@/lib/api/public";
import type { Row } from "./config";
import styles from "./SearchLookup.module.css";

const names: Record<string, string> = {
  students: "O‘quvchi",
  groups: "Guruh",
  courses: "Kurs",
  invoices: "Hisob",
};
export function Lookup({
  endpoint,
  value,
  onChange,
  required = false,
  label,
  id,
}: {
  endpoint: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  id?: string;
}) {
  const resource = endpoint.split("?")[0];
  const caption = label ?? names[resource] ?? "Yozuv";
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Row>();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const search = (draft ?? "").trim();
  const results = useQuery({
    queryKey: ["lookup", endpoint, search],
    enabled: open && search.length > 0,
    queryFn: ({ signal }) =>
      api<Page<Row>>(
        `/teacher/${endpoint}${endpoint.includes("?") ? "&" : "?"}page_size=20&q=${encodeURIComponent(search)}`,
        { signal },
      ),
  });
  const items = results.data?.items ?? [];
  const selected = useQuery({
    queryKey: ["lookup", resource, "selected", value],
    enabled: !!value && chosen?.id !== value,
    queryFn: ({ signal }) =>
      api<Row>(`/teacher/${resource}/${value}`, { signal }),
  });
  function title(row: Row): string {
    if (row.full_name || row.name || row.title) {
      const text = String(row.full_name ?? row.name ?? row.title);
      return resource === "courses" ? localizeText(text) : text;
    }
    if (row.period_start)
      return `${String(row.period_start)} · ${formatMoney(String(row.payable ?? row.amount ?? "0"))} so‘m`;
    return "Yozuv";
  }
  const current = chosen?.id === value ? chosen : selected.data;
  const text = draft ?? (value && current ? title(current) : "");
  const expanded = open && search.length > 0;
  const activeIndex = Math.min(active, Math.max(0, items.length - 1));
  function choose(row: Row) {
    setChosen(row);
    onChange(row.id);
    setDraft(null);
    input.current?.focus();
    setOpen(false);
  }
  return (
    <div
      className={styles.lookup}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <input
        ref={input}
        id={id}
        role="combobox"
        aria-label={caption}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-activedescendant={
          expanded && items.length ? `${listId}-${activeIndex}` : undefined
        }
        aria-required={required}
        autoComplete="off"
        spellCheck={false}
        placeholder={
          resource === "students"
            ? "O‘quvchi ismini yozing"
            : resource === "invoices"
              ? "Sana, summa yoki ism yozing"
              : `${caption} nomini yozing`
        }
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setDraft(event.target.value);
          setOpen(true);
          setActive(0);
          if (value) onChange("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          } else if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
            const next = Math.max(
              0,
              Math.min(
                items.length - 1,
                activeIndex + (event.key === "ArrowDown" ? 1 : -1),
              ),
            );
            setActive(next);
            document
              .getElementById(`${listId}-${next}`)
              ?.scrollIntoView({ block: "nearest" });
          } else if (event.key === "Enter" && expanded) {
            event.preventDefault();
            if (items[activeIndex]) choose(items[activeIndex]);
          }
        }}
      />
      {expanded && (
        <div className={styles.suggestions}>
          {results.isFetching && <p role="status">Qidirilmoqda…</p>}
          {results.error && (
            <div role="alert">
              <p>{results.error.message}</p>
              <button type="button" onClick={() => results.refetch()}>
                Qayta urinish
              </button>
            </div>
          )}
          {!results.isFetching && !results.error && items.length === 0 && (
            <p>Hech narsa topilmadi. Boshqacha yozib ko‘ring.</p>
          )}
          <div
            role="listbox"
            id={listId}
            aria-label={`${caption} bo‘yicha topilganlar`}
          >
            {items.map((row, index) => (
              <button
                key={row.id}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(row)}
              >
                <span>{title(row)}</span>
                {!!(row.phone || row.student_name) && (
                  <small>{String(row.phone ?? row.student_name)}</small>
                )}
              </button>
            ))}
          </div>
          {!!results.data && results.data.total > items.length && (
            <p>Yana variantlar bor. Qidiruvni aniqroq yozing.</p>
          )}
        </div>
      )}
      {selected.error && value && (
        <p className="field-error">{selected.error.message}</p>
      )}
    </div>
  );
}

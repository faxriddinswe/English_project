"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Page } from "@/lib/api/public";
import type { Row } from "./config";
import { display, QueryState } from "./ResourceView";
export function StudentHistory({ studentId }: { studentId: string }) {
  const [resource, setResource] = useState("attendance"),
    [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["teacher", "student-history", studentId, resource, page],
    queryFn: () =>
      api<Page<Row>>(
        `/teacher/students/${studentId}/history?resource=${resource}&page=${page}`,
      ),
  });
  return (
    <section className="action-block">
      <h3>O‘quv tarixi</h3>
      <div className="workspace-tabs">
        {[
          ["attendance", "Davomat"],
          ["assessments", "Baholar"],
          ["submissions", "Vazifalar"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={resource === key}
            onClick={() => {
              setResource(key);
              setPage(1);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <QueryState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      />
      {q.data && (
        <>
          {q.data.items.length === 0 ? (
            <p className="muted">Hozircha yozuv yo‘q.</p>
          ) : (
            q.data.items.map((r) => (
              <article className="timeline-item" key={r.id}>
                <p>
                  {display(r.starts_at ?? r.created_at)} ·{" "}
                  {String(r.title ?? "")} {display(r.status)}
                </p>
                {!!r.revision && (
                  <p>
                    {String(r.revision)}-topshirish ·{" "}
                    {r.late ? "Kechikkan" : "Vaqtida"}
                  </p>
                )}
                <p className="pre-wrap">{String(r.text ?? r.feedback ?? "")}</p>
                {r.score !== undefined && (
                  <p>
                    Ball: {display(r.score)} / {display(r.max_score)}
                  </p>
                )}
              </article>
            ))
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
              {page}-sahifa · {q.data.total} ta
            </span>
            <button
              className="button secondary small"
              disabled={page * 20 >= q.data.total}
              onClick={() => setPage(page + 1)}
            >
              Keyingi →
            </button>
          </div>
        </>
      )}
    </section>
  );
}

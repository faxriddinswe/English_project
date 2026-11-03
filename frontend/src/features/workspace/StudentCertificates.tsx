"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ContentItem, Page } from "@/lib/api/public";
import { SITE_UPDATE_CHANNEL } from "@/lib/site-updates";
import { resultCards } from "@/lib/result-cards";
import { ResultsSection } from "@/components/sections/ResultsSection";
import { QueryState } from "./ResourceView";

export function StudentCertificates() {
  const [page, setPage] = useState(1);
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["student", "certificates", page],
    queryFn: () =>
      api<Page<ContentItem>>(`/student/certificates?page=${page}&page_size=20`),
    refetchInterval: 5000,
  });
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(SITE_UPDATE_CHANNEL);
    channel.onmessage = () => {
      void client.invalidateQueries({ queryKey: ["student", "certificates"] });
    };
    return () => channel.close();
  }, [client]);
  return (
    <>
      <h1>Mening sertifikatlarim</h1>
      <p className="muted">
        Faqat sizga tegishli, ustoz nashr qilgan sertifikatlar.
      </p>
      <QueryState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      />
      {q.data &&
        (q.data.items.length ? (
          <ResultsSection
            results={resultCards(q.data.items)}
            title="IELTS va SEFR sertifikatlari"
            description="Sertifikatni bosib kattalashtirib ko‘rishingiz mumkin."
            showFilters={false}
            pagination={{ total: q.data.total, page, pageSize: 20 }}
          />
        ) : (
          <p className="panel empty-state">
            Hozircha nashr qilingan sertifikatingiz yo‘q.
          </p>
        ))}
      {q.data && q.data.total > 20 && (
        <div className="pager">
          <button
            className="button secondary small"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ← Oldingi
          </button>
          <span>{page}-sahifa</span>
          <button
            className="button secondary small"
            disabled={page * 20 >= q.data.total}
            onClick={() => setPage(page + 1)}
          >
            Keyingi →
          </button>
        </div>
      )}
    </>
  );
}

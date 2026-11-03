"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, mutation } from "@/lib/api/client";
import { notify } from "@/lib/notifications";
import { QueryState } from "./ResourceView";
import { Dialog } from "@/components/ui/Dialog";
import { formatValue } from "@/lib/uz";
import { ScrollTable } from "@/components/ui/ScrollTable";

interface PendingStudent {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  course_id: string | null;
  course_name: string;
  existing_profile?: boolean;
  requested_name?: string;
  created_at: string | null;
}

export function PendingStudentsView() {
  const client = useQueryClient();
  const [rejectingId, setRejectingId] = useState<PendingStudent | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["teacher", "pending-students"],
    queryFn: () =>
      api<{ items: PendingStudent[]; total: number }>(
        "/teacher/pending-students",
      ),
    refetchInterval: 8000, // Real-time background sync every 8 seconds
  });

  const invalidateAll = () => {
    void client.invalidateQueries({
      queryKey: ["teacher", "pending-students"],
    });
    void client.invalidateQueries({ queryKey: ["teacher", "dashboard"] });
    void client.invalidateQueries({ queryKey: ["teacher", "students"] });
    void client.invalidateQueries({ queryKey: ["teacher", "leads"] });
  };

  const approveMutation = useMutation({
    mutationFn: (studentId: string) =>
      mutation<{ message: string; id: string }>(
        `/teacher/pending-students/${studentId}/approve`,
        {},
      ),
    onSuccess: (res) => {
      notify({
        kind: "success",
        title: "O‘quvchi tasdiqlandi",
        description: res.message,
      });
      invalidateAll();
    },
    onError: (err: Error) => {
      notify({
        kind: "error",
        title: "Tasdiqlashda xatolik",
        description: err.message,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (studentId: string) =>
      mutation<{ message: string; id: string }>(
        `/teacher/pending-students/${studentId}/reject`,
        {},
      ),
    onSuccess: (res) => {
      notify({
        kind: "info",
        title: "Ariza rad etildi",
        description: res.message,
      });
      setRejectingId(null);
      invalidateAll();
    },
    onError: (err: Error) => {
      notify({
        kind: "error",
        title: "Xatolik",
        description: err.message,
      });
    },
  });

  const approveAllMutation = useMutation({
    mutationFn: () =>
      mutation<{ approved_count: number; message: string }>(
        "/teacher/pending-students/approve-all",
        {},
      ),
    onSuccess: (res) => {
      notify({
        kind: "success",
        title: "Barcha o‘quvchilar tasdiqlandi",
        description: res.message,
      });
      setConfirmBulk(false);
      invalidateAll();
    },
    onError: (err: Error) => {
      notify({
        kind: "error",
        title: "Ommaviy tasdiqlashda xatolik",
        description: err.message,
      });
    },
  });

  const items = data?.items ?? [];
  const busy =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    approveAllMutation.isPending;

  return (
    <div className="pending-students-page">
      <div className="workspace-title pending-header">
        <div>
          <h1>Yangi o‘quvchilar (Arizalar)</h1>
          <p className="muted">
            Saytdan mustaqil ro‘yxatdan o‘tgan yangi o‘quvchilar ro‘yxati.
            Tasdiqlanganidan so‘ng o‘quvchiga kabinetga kirish ruxsati ochiladi.
          </p>
        </div>
        {items.length > 0 && (
          <div className="pending-header-actions">
            <button
              type="button"
              className="button bulk-approve-btn"
              disabled={busy}
              onClick={() => setConfirmBulk(true)}
            >
              ✓ Barchasini birdan tasdiqlash ({items.length})
            </button>
          </div>
        )}
      </div>

      <QueryState pending={isPending} error={error} retry={() => refetch()} />

      {data && (
        <>
          {items.length === 0 ? (
            <div className="panel empty-state">
              <div className="empty-icon">✓</div>
              <h2>Hozircha yangi arizalar yo‘q</h2>
              <p className="muted">
                Yangi o‘quvchilar saytdan ro‘yxatdan o‘tishganda ularning
                ma’lumotlari real vaqtda shu yerda paydo bo‘ladi.
              </p>
            </div>
          ) : (
            <div className="panel pending-table-container">
              <ScrollTable label="Yangi o‘quvchilar jadvali">
                <table className="data-table pending-table">
                  <thead>
                    <tr>
                      <th>Ism va familiya</th>
                      <th>Telefon raqami</th>
                      <th>Tanlangan kurs</th>
                      <th>Ro‘yxatdan o‘tgan sana</th>
                      <th style={{ textAlign: "right" }}>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((student) => (
                      <tr key={student.id} className="pending-student-row">
                        <td className="pending-name">
                          <strong>
                            {student.full_name}
                            {student.existing_profile && (
                              <small className="existing-profile-request">
                                Mavjud profilga kirish so‘rovi
                                {student.requested_name &&
                                student.requested_name !== student.full_name
                                  ? ` · So‘rovdagi ism: ${student.requested_name}`
                                  : ""}
                              </small>
                            )}
                          </strong>
                        </td>
                        <td className="pending-phone">
                          <a href={`tel:${student.phone}`}>{student.phone}</a>
                        </td>
                        <td className="pending-course">
                          {student.course_name ? (
                            <span className="badge course-badge">
                              {student.course_name}
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className="pending-date muted">
                          {formatValue(student.created_at)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            className="action-buttons-inline"
                            style={{
                              display: "inline-flex",
                              gap: "0.5rem",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              type="button"
                              className="button small approve-btn"
                              disabled={busy}
                              onClick={() => approveMutation.mutate(student.id)}
                              title="O‘quvchini tasdiqlash va kabinetga kirish huquqini berish"
                            >
                              ✓ Tasdiqlash
                            </button>
                            <button
                              type="button"
                              className="button secondary danger small reject-btn"
                              disabled={busy}
                              onClick={() => setRejectingId(student)}
                              title="Arizani rad etish"
                            >
                              ✕ Rad etish
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollTable>
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialog for Reject */}
      <Dialog
        open={!!rejectingId}
        onOpenChange={(open) => !open && setRejectingId(null)}
        title="Arizani rad etish"
      >
        <div className="dialog-content-inner">
          <h3>Arizani rad etishni tasdiqlaysizmi?</h3>
          <p className="muted">
            <strong>{rejectingId?.full_name}</strong> ({rejectingId?.phone}):
            kabinetga kirish so‘rovi rad etiladi.
            {rejectingId?.existing_profile
              ? " Mavjud o‘quvchi profili, guruhlar va moliyaviy tarix saqlanadi."
              : " Ushbu ariza o‘quvchilar ro‘yxatiga qo‘shilmaydi."}
          </p>
          <div
            className="action-buttons"
            style={{
              marginTop: "1.25rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              className="button secondary"
              onClick={() => setRejectingId(null)}
            >
              Bekor qilish
            </button>
            <button
              type="button"
              className="button danger"
              disabled={busy}
              onClick={() => {
                if (rejectingId) {
                  rejectMutation.mutate(rejectingId.id);
                }
              }}
            >
              {rejectMutation.isPending ? "Bajarilmoqda…" : "Ha, rad etilsin"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialog for Bulk Approve */}
      <Dialog
        open={confirmBulk}
        onOpenChange={setConfirmBulk}
        title="Barcha yangi o‘quvchilarni tasdiqlash"
      >
        <div className="dialog-content-inner">
          <h3>Barcha {items.length} ta arizani birdan tasdiqlaysizmi?</h3>
          {items.some((student) => student.existing_profile) && (
            <p className="error-box">
              Mavjud profilga kirish so‘rovlari ham bor. Tasdiqlashdan oldin
              so‘rov yuborganlarning shaxsini tekshiring.
            </p>
          )}
          <p className="muted">
            Barcha kutilayotgan o‘quvchilarga kabinetga kirish ochiladi va ular
            o‘zlari yaratgan parol bilan kabinetga kirish imkoni ochiladi.
          </p>
          <div
            className="action-buttons"
            style={{
              marginTop: "1.25rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              className="button secondary"
              onClick={() => setConfirmBulk(false)}
            >
              Bekor qilish
            </button>
            <button
              type="button"
              className="button bulk-approve-confirm-btn"
              disabled={busy || items.length === 0}
              onClick={() => approveAllMutation.mutate()}
            >
              {approveAllMutation.isPending
                ? "Tasdiqlanmoqda…"
                : "Ha, barchasini tasdiqlash"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

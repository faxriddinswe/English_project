"use client";
import { StudentHistory } from "./StudentHistory";
import { useState } from "react";
import Link from "next/link";
import { mutation } from "@/lib/api/client";
import { Lookup } from "./EntityForm";
import { ActionForm, display } from "./ResourceView";
import { fieldLabel } from "@/lib/uz";
import { groupSchedule } from "./group-schedule";
import { states, type Row, type Field } from "./config";

const reason: Field = {
  name: "reason",
  label: "Sababi",
  type: "textarea",
  required: true,
};
const amount: Field = {
  name: "amount",
  label: "Summa (so‘m)",
  type: "money",
  required: true,
};
const dateField = (name: string, label: string): Field => ({
  name,
  label,
  type: "date",
  required: true,
});

function Enrollment({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const [group, setGroup] = useState("");
  return (
    <div className="action-block">
      <h3>Guruhga qo‘shish</h3>
      <Lookup endpoint="groups" value={group} onChange={setGroup} />
      {group && (
        <ActionForm
          label="Tanlangan guruhga qo‘shish"
          path={`/teacher/groups/${group}/memberships`}
          fields={[
            {
              name: "capacity_override",
              label: "Sig‘imdan oshirishni tasdiqlayman",
              type: "checkbox",
            },
            {
              name: "note",
              label: "Izoh / sig‘imdan oshirish sababi",
              type: "textarea",
            },
          ]}
          transform={(d) => ({ ...d, student_id: row.id })}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function Transfer({ member, onSaved }: { member: Row; onSaved: () => void }) {
  return (
    <div className="membership-row">
      <span>
        {display(member.start_date)} — {display(member.end_date)}
      </span>
      <Link href={`/teacher/groups/${member.group_id}`}>
        {String(member.group_name ?? "Guruh")} ↗
      </Link>
      {!member.end_date && (
        <>
          <ActionForm
            label="Boshqa guruhga ko‘chirish"
            path={`/teacher/memberships/${member.id}/transfer`}
            fields={[
              {
                name: "target_group_id",
                label: "Yangi guruh",
                type: "lookup",
                lookup: "groups",
                required: true,
              },
              dateField("on_date", "Ko‘chirish sanasi"),
              reason,
              {
                name: "capacity_override",
                label: "Sig‘imdan oshirishga rozilik",
                type: "checkbox",
              },
            ]}
            onSaved={onSaved}
          />
          <ActionForm
            label="A’zolikni tugatish / tanaffus"
            path={`/teacher/memberships/${member.id}/end`}
            fields={[
              dateField("end_date", "Oxirgi a’zolikdan keyingi kun"),
              {
                name: "reason",
                label: "Sabab",
                type: "select",
                options: ["pause", "left", "completed", "other"],
              },
              { name: "note", label: "Izoh", type: "textarea" },
            ]}
            onSaved={onSaved}
          />
        </>
      )}
    </div>
  );
}

function AttendanceEditor({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const roster = (row.roster ?? []) as Row[];
  const [values, setValues] = useState<Record<string, string>>(
      Object.fromEntries(roster.map((s) => [s.id, String(s.status ?? "")])),
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="action-block">
      <h3>Dars sanasidagi o‘quvchilar</h3>
      {row.status === "cancelled" ? (
        <p>Bekor qilingan darsga davomat yozilmaydi.</p>
      ) : (
        <>
          <button
            className="button secondary small"
            onClick={() =>
              setValues(
                Object.fromEntries(roster.map((s) => [s.id, "present"])),
              )
            }
          >
            Barchasi keldi
          </button>
          {roster.length === 0 && (
            <p className="empty-state">Bu sanada guruh a’zolari yo‘q.</p>
          )}
          {roster.map((s) => (
            <label className="attendance-row" key={s.id}>
              <span>{String(s.full_name)}</span>
              <select
                value={values[s.id]}
                onChange={(e) =>
                  setValues({ ...values, [s.id]: e.target.value })
                }
              >
                <option value="">Belgilanmagan</option>
                {["present", "late", "absent", "excused"].map((v) => (
                  <option value={v} key={v}>
                    {states[v]}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {error && <p className="error-box">{error}</p>}
          <button
            className="button"
            disabled={busy || !roster.length}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await mutation(
                  `/teacher/lessons/${row.id}/attendance`,
                  {
                    items: roster
                      .filter((s) => values[s.id])
                      .map((s) => ({ student_id: s.id, status: values[s.id] })),
                  },
                  "PUT",
                );
                onSaved();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saqlanmoqda…" : "Davomatni saqlash"}
          </button>
        </>
      )}
    </div>
  );
}

function Conversion({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const [selected, setSelected] = useState("");
  return (
    <div className="action-block">
      <h3>O‘quvchiga aylantirish</h3>
      <p>
        Telefon bir oilada umumiy bo‘lishi mumkin. Mavjud o‘quvchini faqat
        tekshirib tanlang.
      </p>
      {((row.possible_students ?? []) as Row[]).map((s) => (
        <label className="check-label" key={s.id}>
          <input
            type="radio"
            name="matching-student"
            value={s.id}
            checked={selected === s.id}
            onChange={() => setSelected(s.id)}
          />
          <span>
            {String(s.full_name)} · {String(s.phone)}
          </span>
        </label>
      ))}
      <label className="check-label">
        <input
          type="radio"
          name="matching-student"
          checked={!selected}
          onChange={() => setSelected("")}
        />
        <span>Yangi o‘quvchi yaratish</span>
      </label>
      <ActionForm
        label="O‘quvchiga aylantirishni tasdiqlash"
        path={`/teacher/leads/${row.id}/convert`}
        description={
          String(row.full_name) +
          " uchun tanlangan amal bajariladi. Takroriy bosish dublikat yaratmaydi."
        }
        transform={() => ({ existing_student_id: selected || null })}
        onSaved={onSaved}
      />
    </div>
  );
}

function AllocationEditor({ row, onSaved }: { row: Row; onSaved: () => void }) {
  return (
    <ActionForm
      label="Hisobga mablag‘ taqsimlash"
      path={`/teacher/payments/${row.id}/allocations`}
      fields={[
        {
          name: "invoice_id",
          label: "Chiqarilgan hisob",
          type: "lookup",
          lookup: `invoices?student_id=${row.student_id}&status=issued&`,
          required: true,
        },
        amount,
      ]}
      transform={(d) => [d] as unknown as Record<string, unknown>}
      onSaved={onSaved}
      description="Faqat shu o‘quvchining chiqarilgan hisobi tanlansin. Qarzdan yoki erkin mablag‘dan ortiq summa bloklanadi."
    />
  );
}

export function ResourceActions({
  name,
  row,
  onSaved,
  onDeleted,
}: {
  name: string;
  row: Row;
  onSaved: () => void;
  onDeleted?: () => void;
}) {
  return (
    <div className="resource-actions">
      {name === "students" && (
        <>
          <div className="action-buttons">
            <Link
              className="button secondary small"
              href={`/teacher/finance?student_id=${row.id}`}
            >
              Shaxsiy balans va hisoblar
            </Link>
          </div>
          {!row.deleted_at && <Enrollment row={row} onSaved={onSaved} />}
          {!row.deleted_at && (
            <ActionForm
              label="O‘quvchini o‘chirish"
              method="DELETE"
              path={`/teacher/students/${row.id}`}
              fields={[reason]}
              onSaved={onDeleted ?? onSaved}
              danger
              description={`${row.full_name}: kabinet yopiladi, tarix va moliyaviy yozuvlar saqlanadi.`}
            />
          )}
        </>
      )}
      {name === "groups" && (
        <>
          <p className="group-summary-line">
            {String(row.course_name ?? "")} · {String(row.student_count ?? 0)}{" "}
            ta o‘quvchi / {String(row.capacity)} ta joy
          </p>
          {!row.deleted_at && (
            <>
              <ActionForm
                label="Guruhga o‘quvchi qo‘shish"
                path={`/teacher/groups/${row.id}/memberships`}
                fields={[
                  {
                    name: "student_id",
                    label: "O‘quvchi",
                    type: "lookup",
                    lookup: "students",
                    required: true,
                  },
                  {
                    name: "capacity_override",
                    label: "Sig‘imdan oshirishga rozilik",
                    type: "checkbox",
                  },
                  {
                    name: "note",
                    label: "Izoh / sig‘imdan oshirish sababi",
                    type: "textarea",
                  },
                ]}
                onSaved={onSaved}
              />
              <ActionForm
                label="Jadvaldan darslar yaratish"
                path={`/teacher/groups/${row.id}/generate-lessons`}
                fields={[
                  dateField("start_date", "Birinchi sana"),
                  dateField("end_date", "Oxirgi sana (kiradi)"),
                ]}
                onSaved={onSaved}
                description="Eng ko‘pi 93 kun. Takroriy yaratish mavjud darsni ko‘paytirmaydi. Jadval qoidasi o‘zgarsa, oldin yaratilgan darslar saqlanadi."
              />
            </>
          )}
          <p className="group-schedule-line">{groupSchedule(row.rules)}</p>
          {!row.deleted_at && (
            <ActionForm
              label="Guruhni o‘chirish"
              method="DELETE"
              path={`/teacher/groups/${row.id}`}
              fields={[reason]}
              danger
              onSaved={onDeleted ?? onSaved}
              description={`${row.name}: guruh o‘chiriladi va kelgusi rejalangan darslar bekor qilinadi. O‘quvchilar, davomat va to‘lov tarixi saqlanadi.`}
            />
          )}
        </>
      )}
      {name === "courses" && !row.deleted_at && (
        <ActionForm
          label="Kursni o‘chirish"
          method="DELETE"
          path={`/teacher/courses/${row.id}`}
          fields={[reason]}
          danger
          onSaved={onDeleted ?? onSaved}
          description="Kurs o‘chiriladi va saytdan olib tashlanadi. Unga tegishli guruhlar bo‘lsa, avval ularni o‘chiring. Oldingi ta’lim va moliya tarixi saqlanadi."
        />
      )}
      {["lessons", "attendance"].includes(name) && (
        <>
          <div className="action-buttons">
            <ActionForm
              label="Faqat shu darsni ko‘chirish"
              path={`/teacher/lessons/${row.id}/reschedule`}
              fields={[
                {
                  name: "starts_at",
                  label: "Yangi sana va vaqt",
                  type: "datetime-local",
                  required: true,
                },
                {
                  name: "duration_minutes",
                  label: "Davomiyligi (daqiqa)",
                  type: "number",
                  required: true,
                },
                reason,
              ]}
              onSaved={onSaved}
            />
            <ActionForm
              label="Darsni bekor qilish"
              path={`/teacher/lessons/${row.id}/cancel`}
              fields={[reason]}
              danger
              onSaved={onSaved}
              description="Dars bekor qilinadi. Bu amal oylik hisob summasini avtomatik o‘zgartirmaydi."
            />
          </div>
          <AttendanceEditor
            key={String(row.updated_at ?? row.id) + JSON.stringify(row.roster)}
            row={row}
            onSaved={onSaved}
          />
        </>
      )}
      {name === "invoices" && (
        <>
          <div className="action-buttons">
            {row.status === "draft" && (
              <ActionForm
                label="Hisobni chiqarish"
                path={`/teacher/invoices/${row.id}/issue`}
                onSaved={onSaved}
                description={`To‘lanadigan summa: ${display(row.payable, "payable")}. Davr va manual tuzatishlarni tekshirganingizni tasdiqlang.`}
              />
            )}
            <ActionForm
              label="Chegirma / tuzatish"
              path={`/teacher/invoices/${row.id}/adjustments`}
              fields={[
                {
                  name: "amount",
                  label:
                    "Tuzatish: chegirma uchun manfiy, qo‘shimcha uchun musbat UZS",
                  type: "signed-money",
                  required: true,
                },
                reason,
              ]}
              onSaved={onSaved}
            />
            <ActionForm
              label="Hisobni bekor qilish"
              path={`/teacher/invoices/${row.id}/void`}
              fields={[reason]}
              onSaved={onSaved}
              danger
              description="Hisob qarzi bekor qilinadi; unga taqsimlangan pul erkin mablag‘ga qaytadi. Pul qaytarilmaydi."
            />
          </div>
          <h3>Hisob tarkibi</h3>
          {((row.lines ?? []) as Row[]).map((x) => (
            <p key={x.id}>
              {String(x.description)} · {display(x.amount, "amount")}
            </p>
          ))}
          <h3>Tuzatishlar</h3>
          {((row.adjustments ?? []) as Row[]).map((x) => (
            <p key={x.id}>
              {display(x.amount, "amount")} · {String(x.reason)}
            </p>
          ))}
        </>
      )}
      {name === "payments" && !row.void_reason && (
        <>
          <div className="action-buttons">
            {String(row.refunded ?? "0.00") === "0.00" && (
              <ActionForm
                label="To‘lovni tahrirlash"
                method="PUT"
                path={`/teacher/payments/${row.id}`}
                initial={row}
                fields={[
                  amount,
                  {
                    name: "received_at",
                    label: "Qabul qilingan vaqt",
                    type: "datetime-local",
                    required: true,
                  },
                  {
                    name: "method",
                    label: "Usul",
                    type: "select",
                    options: ["cash", "bank_transfer", "other"],
                  },
                  { name: "reference", label: "To‘lov izohi" },
                  reason,
                ]}
                onSaved={onSaved}
                description="Summa kamayganda ortiqcha taqsimlangan mablag‘ bo‘shatiladi va hisob qarzi qayta ochilishi mumkin. O‘quvchi va to‘lov tarixi saqlanadi."
              />
            )}
            <AllocationEditor row={row} onSaved={onSaved} />
            <ActionForm
              label="Pul qaytarish"
              path={`/teacher/payments/${row.id}/refunds`}
              fields={[amount, reason]}
              onSaved={onSaved}
              danger
              description="Dastlabki to‘lovdan pul qaytariladi. Zarur to‘lov taqsimotlari kamayadi va o‘qish qarzi yana ochilishi mumkin; hisob avtomatik bekor qilinmaydi."
            />
            <ActionForm
              label="To‘lovni o‘chirish"
              method="DELETE"
              path={`/teacher/payments/${row.id}`}
              fields={[reason]}
              onSaved={onSaved}
              danger
              description="Noto‘g‘ri yozuv bekor qilinadi va hisoblarga taqsimlangan mablag‘ bo‘shatiladi. Amalda qaytarilgan pulni alohida qayd eting."
            />
          </div>
          <h3>Hisoblarga taqsimlangan mablag‘</h3>
          {((row.allocations ?? []) as Row[]).map((a) => (
            <p key={String(a.invoice_id)}>
              <Link href={`/teacher/finance/invoices/${a.invoice_id}`}>
                Hisob ↗
              </Link>{" "}
              · {display(a.amount, "amount")}
            </p>
          ))}
        </>
      )}
      {name === "payments" && !!row.void_reason && (
        <p className="muted">
          To‘lov o‘chirilgan (bekor qilingan). Tarix saqlandi:{" "}
          {String(row.void_reason)}
        </p>
      )}
      {name === "certificates" && (
        <ActionForm
          label="Sertifikatni o‘chirish"
          method="DELETE"
          path={`/teacher/certificates/${row.id}`}
          danger
          onSaved={onDeleted ?? onSaved}
          description={`${row.title}: sertifikat asosiy sayt va tegishli o‘quvchi kabinetidan olib tashlanadi. Amal tarixda saqlanadi.`}
        />
      )}
      {name === "leads" && (
        <>
          <ActionForm
            label="Holat / izohni yangilash"
            path={`/teacher/leads/${row.id}`}
            method="PATCH"
            initial={row}
            fields={[
              {
                name: "status",
                label: "Holati",
                type: "select",
                options: ["new", "contacted", "trial_scheduled", "closed"],
              },
              {
                name: "follow_up_at",
                label: "Qayta bog‘lanish vaqti",
                type: "datetime-local",
              },
              {
                name: "trial_at",
                label: "Sinov vaqti (faqat kelishilgan bo‘lsa)",
                type: "datetime-local",
              },
              {
                name: "closed_reason",
                label: "Yopish sababi",
                type: "textarea",
              },
              { name: "note", label: "Ustoz izohi", type: "textarea" },
            ]}
            onSaved={onSaved}
          />
          {!row.student_id ? (
            <Conversion row={row} onSaved={onSaved} />
          ) : (
            <Link
              className="button secondary"
              href={`/teacher/students/${row.student_id}`}
            >
              O‘quvchi profilini ochish
            </Link>
          )}
          <ActionForm
            label="Telegram yuborishni qayta urinish"
            path={`/teacher/leads/${row.id}/retry-notification`}
            onSaved={onSaved}
            description="Faqat bot sozlanganida va xabar hali yuborilmagan bo‘lsa navbatga qo‘yiladi."
          />
          <h3>Murojaat tarixi</h3>
          {((row.history ?? []) as Row[]).map((h) => (
            <p className="timeline-item" key={h.id}>
              {display(h.created_at)}
              <br />
              {String(h.note)}
            </p>
          ))}
        </>
      )}
      {name === "assignments" && (
        <>
          <h3>Topshirilgan javoblar va topshirish tarixi</h3>
          {!((row.revisions ?? []) as Row[]).length && (
            <p className="empty-state">Hali javob topshirilmagan.</p>
          )}
          {((row.revisions ?? []) as Row[]).map((r) => (
            <article className="submission-card" key={r.id}>
              <h4>
                {String(r.student_name)} · {String(r.revision)}-versiya
              </h4>
              <p>
                {r.late ? "Kech topshirilgan" : "Vaqtida topshirilgan"} ·{" "}
                {display(r.created_at)}
              </p>
              <p className="pre-wrap">{String(r.text)}</p>
              {!!r.media_id && (
                <a
                  className="button secondary small"
                  href={`/api/v1/media/${r.media_id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Javob fayli ↗
                </a>
              )}
              <p>{String(r.feedback || "Izoh berilmagan")}</p>
              <ActionForm
                label="Izoh va ball berish"
                path={`/teacher/submission-revisions/${r.id}/feedback`}
                fields={[
                  {
                    name: "feedback",
                    label: "O‘quvchiga izoh",
                    type: "textarea",
                  },
                  { name: "score", label: "Ball", type: "money" },
                  {
                    name: "max_score",
                    label: "Eng yuqori ball",
                    type: "money",
                  },
                  {
                    name: "private_note",
                    label: "Ichki izoh (o‘quvchiga ko‘rinmaydi)",
                    type: "textarea",
                  },
                ]}
                initial={r}
                onSaved={onSaved}
              />
            </article>
          ))}
        </>
      )}
      {name === "content" && (
        <>
          <div className="draft-preview">
            <h3>Nashrdan oldingi qoralama</h3>
            <strong>{String(row.title)}</strong>
            {!!row.media_id && (
              <img
                src={`/api/v1/media/${row.media_id}`}
                alt="Qoralama media"
                width={320}
                height={240}
              />
            )}
            <dl>
              {Object.entries((row.data ?? {}) as Record<string, unknown>)
                .filter(([key]) => !!fieldLabel(key) && key !== "sample_key")
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{fieldLabel(k) ?? "Ma’lumot"}</dt>
                    <dd>{display(v, k)}</dd>
                  </div>
                ))}
            </dl>
          </div>
          <ActionForm
            label="Tekshirib nashr qilish"
            path={`/teacher/content/${row.id}/publish`}
            onSaved={onSaved}
            description="Majburiy maydonlar, ommaviy fayl va zarur rozilik tekshiriladi. Hozirgi qoralama public ko‘rinishga chiqariladi."
          />
          <ActionForm
            label="Nashrdan olish"
            path={`/teacher/content/${row.id}/unpublish`}
            onSaved={onSaved}
            description="Bu kontent ochiq saytdan olib tashlanadi, qoralama saqlanadi."
          />
        </>
      )}
    </div>
  );
}

export function RecordHistory({
  name,
  row,
  onSaved,
}: {
  name: string;
  row: Row;
  onSaved: () => void;
}) {
  if (name === "students")
    return (
      <div className="record-history">
        {" "}
        <StudentHistory studentId={row.id} />
        <h3>A’zolik tarixi</h3>
        {((row.memberships ?? []) as Row[]).map((m) =>
          !row.deleted_at && m.is_current ? (
            <Transfer key={m.id} member={m} onSaved={onSaved} />
          ) : (
            <p key={m.id}>
              {String(m.group_name ?? "Guruh")} · {display(m.start_date)} —{" "}
              {m.end_date ? display(m.end_date) : "Hozirgacha"}
            </p>
          ),
        )}
      </div>
    );
  if (name === "groups")
    return (
      <div className="record-history">
        {" "}
        <h3>A’zolar tarixi</h3>
        {((row.memberships ?? []) as Row[]).map((m) => (
          <div key={m.id}>
            <Link href={`/teacher/students/${m.student_id}`}>
              {String(m.student_name ?? "O‘quvchi profili")} ↗{" "}
              {m.is_current ? "· Amaldagi a’zo" : "· Tarix"}
            </Link>
            {!row.deleted_at && Boolean(m.is_current) && (
              <Transfer
                member={{ ...m, group_id: row.id, group_name: row.name }}
                onSaved={onSaved}
              />
            )}
          </div>
        ))}
      </div>
    );
  return null;
}

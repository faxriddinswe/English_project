export type Row = Record<string, unknown> & { id: string };
export type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  lookup?: string;
  publicMedia?: boolean;
};
export type Resource = {
  title: string;
  endpoint: string;
  fields: Field[];
  columns: string[];
  readOnly?: boolean;
};
const f = (
  name: string,
  label: string,
  type = "text",
  required = false,
): Field => ({ name, label, type, required });
export const resources: Record<string, Resource> = {
  students: {
    title: "O‘quvchilar",
    endpoint: "students",
    columns: ["full_name", "phone", "joined_on"],
    fields: [
      f("full_name", "Ism va familiya", "text", true),
      f("phone", "Telefon", "tel", true),
      f("parent_phone", "Ota-ona telefoni (ixtiyoriy)", "tel"),
      f("joined_on", "Qo‘shilgan sana", "date", true),
      f("private_note", "Ichki izoh (faqat ustozga)", "textarea"),
    ],
  },
  groups: {
    title: "Guruhlar",
    endpoint: "groups",
    columns: [
      "name",
      "course_name",
      "student_count",
      "rules",
      "capacity",
      "monthly_price",
    ],
    fields: [
      {
        name: "course_id",
        label: "Kurs",
        type: "lookup",
        lookup: "courses",
        required: true,
      },
      f("name", "Guruh nomi", "text", true),
      f("level", "Daraja"),
      f("capacity", "Sig‘im", "number", true),
      f("start_date", "Boshlanish sanasi", "date", true),
      f("end_date", "Tugash sanasi", "date"),
      f("monthly_price", "Oylik narx (so‘m)", "money", true),
      f("location", "Manzil yoki masofaviy dars havolasi"),
      f("rules", "Haftalik dars jadvali", "rules"),
    ],
  },
  lessons: {
    title: "Darslar / jadval",
    endpoint: "lessons",
    columns: ["group_id", "starts_at", "ends_at", "status"],
    fields: [],
    readOnly: true,
  },
  attendance: {
    title: "Davomat",
    endpoint: "lessons",
    columns: ["group_id", "starts_at", "status"],
    fields: [],
    readOnly: true,
  },
  invoices: {
    title: "Hisoblar",
    endpoint: "invoices",
    columns: ["student_id", "period_start", "amount", "paid", "debt", "status"],
    fields: [
      {
        name: "student_id",
        label: "O‘quvchi",
        type: "lookup",
        lookup: "students",
        required: true,
      },
      f("month", "Qaysi oy uchun", "month", true),
      f("due_date", "Sana (qaysi kuni bo‘ldi)", "date", true),
      f("amount", "Hisob summasi (so‘m)", "money", true),
    ],
  },
  payments: {
    title: "To‘lovlar",
    endpoint: "payments",
    columns: [
      "student_id",
      "amount",
      "received_at",
      "method",
      "reference",
      "void_reason",
    ],
    fields: [
      {
        name: "student_id",
        label: "O‘quvchi",
        type: "lookup",
        lookup: "students",
        required: true,
      },
      f("amount", "Qabul qilingan pul (so‘m)", "money", true),
      f("received_at", "Qabul qilingan vaqt", "datetime-local", true),
      {
        name: "method",
        label: "To‘lov usuli",
        type: "select",
        options: ["cash", "bank_transfer", "other"],
      },
      f("reference", "To‘lov izohi / reference"),
    ],
  },
  assignments: {
    title: "Vazifalar",
    endpoint: "assignments",
    columns: ["title", "group_id", "deadline", "published"],
    fields: [
      {
        name: "group_id",
        label: "Guruh",
        type: "lookup",
        lookup: "groups",
        required: true,
      },
      f("title", "Sarlavha", "text", true),
      f("description", "Vazifa matni", "textarea", true),
      f("deadline", "Topshirish muddati", "datetime-local", true),
      f("link", "Havola (ixtiyoriy)", "url"),
      f("media_id", "Vazifa fayli", "media"),
      f("published", "O‘quvchilarga nashr qilish", "checkbox"),
      f("deadline_lock", "Muddatdan keyin topshirishni yopish", "checkbox"),
    ],
  },
  assessments: {
    title: "Ichki baholar",
    endpoint: "assessments",
    columns: ["title", "student_id", "score", "max_score", "feedback"],
    fields: [
      {
        name: "student_id",
        label: "O‘quvchi",
        type: "lookup",
        lookup: "students",
        required: true,
      },
      {
        name: "group_id",
        label: "Guruh",
        type: "lookup",
        lookup: "groups",
        required: true,
      },
      f("title", "Baholash nomi", "text", true),
      f("score", "Ball", "money", true),
      f("max_score", "Eng yuqori ball", "money", true),
      f("feedback", "O‘quvchiga izoh", "textarea"),
      f("private_note", "Ichki izoh", "textarea"),
    ],
  },
  leads: {
    title: "Murojaatlar",
    endpoint: "leads",
    columns: ["full_name", "phone", "status", "telegram_status", "created_at"],
    fields: [],
    readOnly: true,
  },
  content: {
    title: "Sayt kontenti",
    endpoint: "content",
    columns: ["kind", "title", "published", "approved", "consent"],
    fields: [
      {
        name: "kind",
        label: "Kontent turi",
        type: "select",
        options: [
          "hero",
          "bio",
          "stat",
          "benefit",
          "result",
          "testimonial",
          "gallery",
          "faq",
          "contact",
          "privacy",
        ],
      },
      f("title", "Sarlavha / savol", "text", true),
      f("data", "Mazmuni", "content"),
      {
        name: "media_id",
        label: "Ommaviy media (shaxsiy raqamlar berkitilgan)",
        type: "media",
        publicMedia: true,
      },
      f("consent", "Ism/media nashriga rozilik olingan", "checkbox"),
      f("approved", "Ustoz tomonidan tekshirilgan", "checkbox"),
      f("sort_order", "Tartib raqami", "number"),
    ],
  },
  certificates: {
    title: "O‘quvchilar sertifikatlari",
    endpoint: "certificates",
    columns: [
      "title",
      "media_url",
      "certificate_type",
      "result_score",
      "published",
    ],
    fields: [
      {
        name: "kind",
        label: "Kontent turi",
        type: "select",
        options: ["result"],
      },
      {
        name: "student_id",
        label: "O‘quvchi",
        type: "lookup",
        lookup: "students",
        required: true,
      },
      f("title", "Sertifikat sarlavhasi", "text", true),
      f("data", "Sertifikat ma’lumotlari", "content"),
      {
        name: "media_id",
        label: "Sertifikat rasmi (shaxsiy raqamlar berkitilgan)",
        type: "media",
        publicMedia: true,
        required: true,
      },
      f("consent", "Ism/media nashriga rozilik olingan", "checkbox"),
      f("approved", "Ustoz tomonidan tekshirilgan", "checkbox"),
      f("published", "Saqlaganda saytda va o‘quvchiga ko‘rsatish", "checkbox"),
      f("sort_order", "Tartib raqami", "number"),
    ],
  },
  courses: {
    title: "Kurslar kontenti",
    endpoint: "courses",
    columns: ["name", "slug", "marketing_price", "published"],
    fields: [
      f("name", "Kurs nomi", "text", true),
      f("slug", "Havola nomi (masalan, general-english)", "text", true),
      f("short_description", "Qisqa izoh", "textarea", true),
      f("description", "To‘liq dastur", "textarea"),
      f("audience", "Kimlar uchun", "textarea"),
      f("level", "Boshlang‘ich daraja"),
      f("features", "Dastur punktlari (har qatorda bittadan)", "lines"),
      f("duration", "Davomiylik"),
      f("lessons_per_week", "Haftadagi darslar soni", "number"),
      f("lesson_minutes", "Dars davomiyligi (daqiqa)", "number"),
      {
        name: "format",
        label: "Format",
        type: "select",
        options: ["", "online", "offline", "hybrid"],
      },
      f("schedule", "Ommaviy jadval izohi"),
      f("marketing_price", "Ommaviy narx (billingdan alohida)", "money"),
      f("sort_order", "Tartib", "number"),
      f("published", "Nashr qilingan", "checkbox"),
    ],
  },
  materials: {
    title: "Materiallar",
    endpoint: "materials",
    columns: ["title", "group_id", "published"],
    fields: [
      {
        name: "group_id",
        label: "Guruh",
        type: "lookup",
        lookup: "groups",
        required: true,
      },
      f("title", "Material nomi", "text", true),
      f("link", "Havola", "url"),
      f("media_id", "Fayl", "media"),
      f("published", "Nashr qilish", "checkbox"),
    ],
  },
};
export { labels, states } from "@/lib/uz";

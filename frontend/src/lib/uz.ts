import { formatMoney } from "./utils/money";
export const labels: Record<string, string> = {
  full_name: "Ism va familiya",
  student_count: "O‘quvchilar soni",
  course_name: "Kurs",
  rules: "Dars kunlari va vaqti",
  certificate_type: "Imtihon turi",
  result_score: "Natija",
  media_url: "Sertifikat",
  phone: "Telefon",
  status: "Holati",
  joined_on: "Qo‘shilgan sana",
  name: "Nomi",
  level: "Daraja",
  capacity: "Sig‘im",
  monthly_price: "Oylik narx",
  group_id: "Guruh",
  student_id: "O‘quvchi",
  starts_at: "Boshlanishi",
  ends_at: "Tugashi",
  period_start: "Qaysi oy uchun",
  amount: "Summa",
  paid: "To‘langan",
  debt: "Qarz",
  received_at: "Qabul qilingan",
  method: "Usul",
  reference: "Izoh",
  void_reason: "Bekor qilish sababi",
  title: "Sarlavha",
  deadline: "Muddat",
  published: "Nashr",
  telegram_status: "Telegram",
  created_at: "Yaratilgan",
  kind: "Turi",
  approved: "Tasdiq",
  consent: "Rozilik",
  slug: "Havola nomi",
  marketing_price: "Ommaviy narx",
  score: "Ball",
  max_score: "Eng yuqori ball",
  feedback: "Izoh",
};
export const states: Record<string, string> = {
  ielts: "IELTS",
  cefr: "SEFR",
  scheduled: "Rejalangan",
  completed: "O‘tilgan",
  cancelled: "Bekor qilingan",
  present: "Keldi",
  late: "Kechikdi",
  absent: "Kelmadi",
  excused: "Sababli kelmadi",
  draft: "Qoralama",
  issued: "Chiqarilgan",
  void: "Bekor qilingan",
  cash: "Naqd",
  bank_transfer: "Bank o‘tkazmasi",
  other: "Boshqa",
  new: "Yangi",
  contacted: "Bog‘lanilgan",
  trial_scheduled: "Sinov rejalangan",
  converted: "O‘quvchiga aylantirilgan",
  closed: "Yopilgan",
  pending: "Navbatda",
  processing: "Yuborilmoqda",
  sent: "Yuborilgan",
  retry: "Qayta urinish",
  failed: "Xatolik",
  disabled: "Sozlanmagan",
  hero: "Bosh sarlavha",
  bio: "Ustoz haqida",
  stat: "Statistika",
  benefit: "Afzallik",
  result: "Ommaviy natija",
  testimonial: "Fikr",
  gallery: "Galereya",
  faq: "Savol-javob",
  contact: "Kontaktlar",
  privacy: "Maxfiylik",
};

Object.assign(labels, {
  updated_at: "Yangilangan vaqti",
  submitted_at: "Topshirilgan vaqti",
  role: "Vazifa",
  username: "Kirish nomi",
  description: "Tavsif",
  comment: "Izoh",
  source: "Kelgan sahifa",
  private_note: "Ichki izoh",
  payable: "To‘lanadigan summa",
  unallocated_credit: "Erkin mablag‘",
  refunded: "Qaytarilgan pul",
  due_date: "To‘lov muddati",
  period_end: "Davr oxiri",
  change_reason: "O‘zgarish sababi",
  follow_up_at: "Qayta bog‘lanish vaqti",
  trial_at: "Sinov sanasi",
  start_date: "Boshlanish sanasi",
  end_date: "Tugash sanasi",
  billing_policy: "Hisoblash tartibi",
  location: "Dars manzili",
  parent_phone: "Ota-ona telefoni",
  group_name: "Guruh",
  note: "Izoh",
  exit_reason: "Chiqish sababi",
  amount: "Summa",
  adjustment: "Summa tuzatishi",
  received: "Qabul qilingan pul",
  net_receipts: "Qaytarishdan keyingi tushum",
  attendance_percent: "Davomat foizi",
  unmarked_attendance: "Belgilanmagan davomat",
  student_count: "O‘quvchilar soni",
  group_count: "Guruhlar soni",
  today_lessons: "Bugungi darslar",
  new_leads: "Yangi murojaatlar",
  absence_threshold: "Ketma-ket kelmaslik chegarasi",
  billing_due_day: "To‘lov kuni",
  month: "Qaysi oy uchun",
  telegram_configured: "Telegram ulangan",
  storage_backend: "Fayl ombori",
  body: "Asosiy matn",
  subheading: "Qisqa izoh",
  value: "Qiymat",
  label: "Tavsif",
  tags: "Mavzular",
  student_name_public: "Ko‘rinadigan ism",
  type: "Imtihon turi",
  student_name: "O‘quvchi ismi",
  exam_date: "Imtihon sanasi",
  listening: "Tinglab tushunish",
  reading: "O‘qish",
  writing: "Yozish",
  speaking: "Gapirish",
  overall: "Umumiy ball",
  cefr_score: "SEFR balli",
  is_sample: "Namuna",
  sample_key: "Namuna belgisi",
  media_id: "Rasm yoki fayl",
  media_url: "Rasm",
  certificate_ids: "Sertifikatlar",
  video_url: "Video havolasi",
  address: "Manzil",
  phone: "Telefon",
  telegram: "Telegram",
  instagram: "Instagram",
  youtube: "YouTube",
  experience: "Tajriba",
  students_taught: "Ta’lim olgan o‘quvchilar",
  format: "Dars shakli",
  duration: "Davomiylik",
  lessons_per_week: "Haftalik darslar",
  lesson_minutes: "Dars davomiyligi",
  audience: "Kimlar uchun",
  features: "Dastur mavzulari",
  schedule: "Jadval",
  sort_order: "Tartib",
  revision: "Topshirish tartibi",
  max_score: "Eng yuqori ball",
  late: "Kechikkan",
  message: "Xabar",
  success: "Muvaffaqiyatli",
  accepted: "Qabul qilingan",
  created: "Yaratilgan yozuvlar",
  skipped: "O‘tkazib yuborilgan yozuvlar",
  count: "Soni",
  timezone: "Vaqt mintaqasi",
  alt: "Rasm tavsifi",
  reference: "To‘lov izohi",
});
Object.assign(states, {
  accepted: "Qabul qilingan",
  updated: "Yangilangan",
  submitted: "Topshirilgan",
  reviewed: "Tekshirilgan",
  graded: "Baholangan",
  rejected: "Qaytarilgan",
  approved: "Tasdiqlangan",
  published: "Nashr qilingan",
  deleted: "O‘chirilgan",
  success: "Muvaffaqiyatli",
  error: "Xatolik",
  unmarked: "Belgilanmagan",
  pause: "Tanaffus",
  transfer: "Boshqa guruhga ko‘chgan",
  teacher: "Ustoz",
  student: "O‘quvchi",
  online: "Masofaviy",
  offline: "Yuzma-yuz",
  hybrid: "Aralash",
  calendar_month: "Kalendar oyi bo‘yicha",
  disk: "Mahalliy fayl ombori",
  s3: "Bulutli fayl ombori",
  settings: "Sozlamalar",
  disabled: "Sozlanmagan",
  processing: "Yuborilmoqda",
  late: "Kechikkan",
});
const months = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];
const moneyFields = new Set([
  "amount",
  "monthly_price",
  "marketing_price",
  "paid",
  "debt",
  "payable",
  "unallocated_credit",
  "refunded",
  "overdue",
  "received",
  "net_receipts",
  "adjustment",
]);
const enums = new Set([
  "status",
  "method",
  "kind",
  "role",
  "format",
  "billing_policy",
  "telegram_status",
  "exit_reason",
  "type",
  "certificate_type",
  "storage_backend",
]);
export function fieldLabel(key: string): string | undefined {
  return labels[key] ?? labels[key.split(".").at(-1) ?? ""];
}
export function localizeText(value: string): string {
  const replacements: [RegExp, string][] = [
    [/General English/gi, "Umumiy ingliz tili"],
    [/Listening/g, "Tinglab tushunish"],
    [/Reading/g, "O‘qish"],
    [/Writing/g, "Yozish"],
    [/Speaking/g, "Gapirish"],
    [/Overall/g, "Umumiy ball"],
    [/\bfeedback\b/gi, "ustoz izohi"],
    [/\bdeadline\b/gi, "topshirish muddati"],
    [/\brevision\b/gi, "topshirish nusxasi"],
    [/\boverride\b/gi, "sig‘imdan oshirish"],
    [/\brefund\b/gi, "pul qaytarish"],
    [/\bvoid\b/gi, "bekor qilish"],
    [/\badjustment\b/gi, "summa tuzatishi"],
    [/\ballocation\b/gi, "to‘lov taqsimoti"],
    [/\bbilling\b/gi, "hisoblash"],
    [/\bdraft\b/gi, "qoralama"],
    [/\bgeneration\b/gi, "yaratish"],
    [/\bpreview\b/gi, "oldindan ko‘rish"],
    [/\bexport\b/gi, "yuklab olish"],
  ];
  return replacements.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}
export function formatValue(value: unknown, key = ""): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ha" : "Yo‘q";
  if (typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sana belgilanmagan";
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tashkent",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const part = (name: string) =>
      parts.find((part) => part.type === name)?.value ?? "";
    return `${part("day")} ${months[Number(part("month")) - 1]} ${part("year")}, ${part("hour")}:${part("minute")}`;
  }
  if (
    (key === "period_start" || key === "month") &&
    typeof value === "string" &&
    /^\d{4}-\d\d(-\d\d)?$/.test(value)
  ) {
    const [y, m] = value.split("-");
    const monthName = months[Number(m) - 1];
    if (monthName)
      return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y}`;
  }
  if (typeof value === "string" && /^\d{4}-\d\d-\d\d$/.test(value))
    return value.split("-").reverse().join(".");
  if (key === "source" && typeof value === "string" && value.startsWith("/"))
    return (
      (
        {
          "/": "Asosiy sahifa",
          "/about": "Ustoz haqida",
          "/courses": "Kurslar sahifasi",
          "/results": "Natijalar sahifasi",
          "/faq": "Savollar sahifasi",
          "/contact": "Bog‘lanish sahifasi",
        } as Record<string, string>
      )[value] ?? "Saytdagi sahifa"
    );
  if (key === "timezone") return "Toshkent vaqti";
  if (moneyFields.has(key)) return `${formatMoney(value)} so‘m`;
  if (typeof value === "object")
    return Array.isArray(value)
      ? value.map((item) => formatValue(item, key)).join(", ")
      : "";
  if (enums.has(key)) return states[String(value)] ?? "Holat belgilanmagan";
  if (key === "course_name") return localizeText(String(value));
  return states[String(value)] ?? String(value);
}
export function safeErrorText(value: string): string {
  const normalized = value.replace(/^Value error,\s*/i, "");
  if (
    /^(Field required|Input should|Invalid|String should|Not Found|Method Not Allowed)/i.test(
      normalized,
    )
  )
    return "Ma’lumotni tekshiring va qayta urinib ko‘ring.";
  return localizeText(normalized);
}

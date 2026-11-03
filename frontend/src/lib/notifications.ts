export type NotificationKind = "success" | "error" | "info";
export type NotificationMessage = {
  title: string;
  description?: string;
  kind: NotificationKind;
};
export const NOTIFICATION_EVENT = "sherzod-notification";
export function notify(message: NotificationMessage) {
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_EVENT, { detail: message }),
    );
}
export function clearNotifications() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: null }));
}

export function mutationNotice(path: string, method: string): string {
  if (path === "/auth/login") return "Kabinetga muvaffaqiyatli kirdingiz.";
  if (path === "/auth/logout") return "Kabinetdan chiqdingiz.";
  if (path === "/auth/change-password") return "Parolingiz yangilandi.";
  if (path === "/public/leads") return "Arizangiz qabul qilindi.";
  if (path.endsWith("/attendance")) return "Davomat saqlandi.";
  if (path.endsWith("/submission")) return "Javobingiz qabul qilindi.";
  if (path.endsWith("/feedback")) return "Ustoz izohi va ball saqlandi.";
  if (path.endsWith("/memberships")) return "O‘quvchi guruhga qo‘shildi.";
  if (path.endsWith("/transfer")) return "O‘quvchi boshqa guruhga o‘tkazildi.";
  if (path.endsWith("/end")) return "Guruh a’zoligi yakunlandi.";
  if (path.endsWith("/generate-lessons"))
    return "Jadval bo‘yicha darslar yaratildi.";
  if (path.endsWith("/reschedule")) return "Dars vaqti o‘zgartirildi.";
  if (path.endsWith("/cancel")) return "Dars bekor qilindi.";
  if (path.endsWith("/allocations")) return "To‘lov hisobga taqsimlandi.";
  if (path.endsWith("/refunds")) return "Pul qaytarish qayd etildi.";
  if (path.endsWith("/adjustments")) return "Hisob summasi tuzatildi.";
  if (path.endsWith("/issue")) return "Hisob chiqarildi.";
  if (path.endsWith("/void")) return "Yozuv bekor qilindi, tarixi saqlandi.";
  if (path.endsWith("/generate")) return "Oylik qoralama hisoblar yaratildi.";
  if (path.endsWith("/publish")) return "Ma’lumot saytda nashr qilindi.";
  if (path.endsWith("/unpublish")) return "Ma’lumot nashrdan olindi.";
  if (path.endsWith("/archive")) return "O‘quvchi arxivlandi.";
  if (path.endsWith("/convert")) return "Murojaat o‘quvchiga aylantirildi.";
  if (path.endsWith("/retry-notification"))
    return "Xabar yuborish navbatga qo‘yildi.";
  if (path === "/student/profile") return "Aloqa ma’lumotlaringiz saqlandi.";
  if (path === "/teacher/settings") return "Sozlamalar saqlandi.";
  const noun = path.includes("/certificates")
    ? "Sertifikat"
    : path.includes("/payments")
      ? "To‘lov"
      : path.includes("/invoices")
        ? "Hisob"
        : path.includes("/groups")
          ? "Guruh"
          : path.includes("/students")
            ? "O‘quvchi"
            : path.includes("/assignments")
              ? "Vazifa"
              : path.includes("/materials")
                ? "Material"
                : path.includes("/courses")
                  ? "Kurs"
                  : "Ma’lumot";
  return `${noun} ${method === "DELETE" ? "o‘chirildi." : method === "POST" ? "qo‘shildi." : "yangilandi."}`;
}

import { notify, clearNotifications, mutationNotice } from "../notifications";
import { safeErrorText } from "../uz";
import { announceWorkspaceUpdate } from "../workspace-updates";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

let csrf: string | undefined;
export async function api<T>(
  path: string,
  options: RequestInit = {},
  retryCsrf = true,
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (!["GET", "HEAD"].includes(method)) {
    // Another tab or a form helper may have refreshed the readable signed cookie.
    if (typeof document !== "undefined") {
      const current = document.cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("se_csrf="))
        ?.slice("se_csrf=".length);
      try {
        csrf = current ? decodeURIComponent(current) : undefined;
      } catch {
        csrf = undefined;
      }
    }
    if (!csrf) {
      try {
        const res = await fetch("/api/v1/auth/csrf", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok)
          throw new ApiError(
            res.status,
            "csrf_unavailable",
            "Ulanish mavjud emas. Qayta urinib ko‘ring.",
          );
        const payload = (await res.json()) as { token?: string };
        if (!payload.token)
          throw new ApiError(
            0,
            "csrf_unavailable",
            "Sahifani yangilang va qayta urinib ko‘ring.",
          );
        csrf = payload.token;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
          0,
          "network_error",
          "Aloqa mavjud emas. Ma’lumot saqlanmadi. Qayta urinib ko‘ring.",
        );
      }
    }
    headers.set("X-CSRF-Token", csrf!);
    if (options.body && !headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
  }
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      ...options,
      method,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "network_error",
      "Internet yoki server bilan aloqa yo‘q. Ma’lumot saqlanmadi. Qayta urinib ko‘ring.",
    );
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
      field_errors?: Record<string, string>;
    };
    if (data.code === "csrf_failed") {
      csrf = undefined;
      // This middleware rejection happens before the business operation. Retry once,
      // preserving the body and idempotency key; other failures are never replayed.
      if (retryCsrf && !options.signal?.aborted)
        return api<T>(path, options, false);
    }
    throw new ApiError(
      res.status,
      data.code ?? "request_error",
      safeErrorText(
        data.message ?? "So‘rov bajarilmadi. Qayta urinib ko‘ring.",
      ),
      data.field_errors
        ? Object.fromEntries(
            Object.entries(data.field_errors).map(([key, value]) => [
              key,
              safeErrorText(value),
            ]),
          )
        : undefined,
    );
  }
  if (res.status === 204) return undefined as T;
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(
      res.status,
      "invalid_response",
      "Javobni o‘qib bo‘lmadi. Sahifani yangilang va qayta urinib ko‘ring.",
    );
  }
}

export async function mutation<T>(
  path: string,
  body?: unknown,
  method = "POST",
  key?: string,
): Promise<T> {
  try {
    const result = await api<T>(path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: key ? { "Idempotency-Key": key } : undefined,
    });
    if (path === "/auth/logout" || path === "/auth/login") clearNotifications();
    if (path.startsWith("/teacher/") || path === "/auth/register")
      announceWorkspaceUpdate();
    const created = (
      result && typeof result === "object"
        ? (result as Record<string, unknown>)
        : {}
    ).created;
    notify({
      kind: "success",
      title:
        typeof created === "number" && created === 0
          ? "Yangi yozuv talab qilinmadi."
          : mutationNotice(path, method),
      description:
        typeof created === "number"
          ? `Yaratilgan yozuvlar: ${created}`
          : undefined,
    });
    return result;
  } catch (error) {
    notify({
      kind: "error",
      title: "Amal bajarilmadi.",
      description:
        error instanceof Error
          ? safeErrorText(error.message)
          : "Qayta urinib ko‘ring.",
    });
    throw error;
  }
}

export async function upload(
  file: File,
  visibility = "private",
  alt = "",
  prepared = false,
  role = "teacher",
) {
  if (file.size > (file.type.startsWith("image/") ? 5 : 10) * 1024 * 1024) {
    const error = new Error("Rasm 5 MB, PDF 10 MB dan oshmasin.");
    notify({
      kind: "error",
      title: "Fayl yuklanmadi.",
      description: error.message,
    });
    throw error;
  }
  try {
    const result = await api<{ id: string }>(
      `/${role}/media/uploads?visibility=${visibility}&alt=${encodeURIComponent(alt)}&public_prepared=${prepared}`,
      {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": "application/octet-stream",
          "X-File-Type": file.type,
        },
      },
    );
    notify({
      kind: "success",
      title: "Fayl yuklandi.",
      description: "Uni yozuvga qo‘shish uchun formani saqlang.",
    });
    return result;
  } catch (error) {
    notify({
      kind: "error",
      title: "Fayl yuklanmadi.",
      description:
        error instanceof Error
          ? safeErrorText(error.message)
          : "Qayta urinib ko‘ring.",
    });
    throw error;
  }
}

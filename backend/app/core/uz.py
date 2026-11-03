"""Uzbek UI validation text; machine-readable codes and field paths stay stable."""


def validation_message(item):
    kind = item.get("type", "")
    ctx = item.get("ctx") or {}
    if kind == "missing":
        return "Bu maydonni to‘ldiring"
    if kind == "string_too_short":
        return f"Kamida {ctx.get('min_length', 1)} ta belgi kiriting"
    if kind == "string_too_long":
        return f"Ko‘pi bilan {ctx.get('max_length')} ta belgi kiriting"
    if kind in ("literal_error", "enum"):
        return "Ro‘yxatdagi qiymatlardan birini tanlang"
    if kind in ("greater_than", "greater_than_equal", "less_than", "less_than_equal"):
        limit = next(
            (ctx.get(key) for key in ("gt", "ge", "lt", "le") if key in ctx),
            "belgilangan chegaradan",
        )
        suffix = {
            "greater_than": "katta",
            "greater_than_equal": "kam bo‘lmagan",
            "less_than": "kichik",
            "less_than_equal": "oshmagan",
        }[kind]
        return f"Qiymat {limit} dan {suffix} bo‘lsin"
    if kind.startswith("uuid"):
        return "Ro‘yxatdan to‘g‘ri yozuvni tanlang"
    if kind.startswith(("decimal", "float", "int")) or kind == "finite_number":
        return "Sonni to‘g‘ri kiriting; pul uchun kasrdan keyin ko‘pi bilan 2 xona yozing"
    if kind.startswith(("date", "time")):
        return "Sana va vaqtni to‘g‘ri kiriting"
    if kind == "extra_forbidden":
        return "Bu maydonni o‘zgartirishga ruxsat yo‘q"
    if kind == "value_error" and "phone" in ".".join(str(part) for part in item.get("loc", [])):
        return "Telefon raqamini +998XXXXXXXXX ko‘rinishida kiriting"
    return "Qiymatni tekshiring va to‘g‘ri ma’lumot kiriting"

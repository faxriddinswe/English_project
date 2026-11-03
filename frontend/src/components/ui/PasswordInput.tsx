"use client";
import { useId, useState, type ComponentPropsWithRef } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordInput({
  visibilityLabel = "Parol",
  ...props
}: ComponentPropsWithRef<"input"> & { visibilityLabel?: string }) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <div className="password-control">
      <input {...props} id={id} type={visible ? "text" : "password"} />
      <button
        type="button"
        aria-controls={id}
        aria-label={`${visibilityLabel}ni ${visible ? "yashirish" : "ko‘rsatish"}`}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? (
          <EyeOff size={20} aria-hidden="true" />
        ) : (
          <Eye size={20} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

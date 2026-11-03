"use client";
import { useState, type InputHTMLAttributes } from "react";

/** Keeps the browser's real, keyboard-operable file control with Uzbek copy. */
export function FileInput({
  onChange,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [name, setName] = useState("");
  return (
    <span className={`file-picker ${className}`}>
      <span className="file-picker-action" aria-hidden="true">
        Fayl tanlash
      </span>
      <span className="file-picker-name" aria-hidden="true">
        {name || "Fayl tanlanmagan"}
      </span>
      <input
        {...props}
        type="file"
        onChange={(event) => {
          setName(event.target.files?.[0]?.name ?? "");
          onChange?.(event);
        }}
      />
    </span>
  );
}

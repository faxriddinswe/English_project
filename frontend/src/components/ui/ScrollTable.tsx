"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function ScrollTable({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const region = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const element = region.current;
    if (!element) return;
    const measure = () =>
      setOverflows(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const table = element.querySelector("table");
    if (table) observer.observe(table);
    measure();
    return () => observer.disconnect();
  }, []);
  return (
    <>
      {overflows && (
        <p id={hintId} className="table-hint">
          Jadvalni yon tomonga suring ↔
        </p>
      )}
      <div
        ref={region}
        className="table-scroll"
        role="region"
        aria-label={label}
        aria-describedby={overflows ? hintId : undefined}
        tabIndex={overflows ? 0 : undefined}
      >
        {children}
      </div>
    </>
  );
}

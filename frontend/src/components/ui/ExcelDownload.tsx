"use client";
import { Download } from "lucide-react";
import { DownloadButton } from "./DownloadButton";

export function ExcelDownload({
  resource = "all",
  month,
  children,
  className,
}: {
  resource?: string;
  month?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const params = new URLSearchParams({ resource });
  if (month && /^\d{4}-\d{2}$/.test(month)) params.set("month", month + "-01");
  return (
    <DownloadButton
      path={`/api/v1/teacher/reports/export.xlsx?${params}`}
      filename={`sherzod-${resource}${month ? "-" + month : ""}.xlsx`}
      className={className}
    >
      <Download size={16} aria-hidden="true" />{" "}
      {children ?? "Excel yuklab olish"}
    </DownloadButton>
  );
}

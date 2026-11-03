import { fieldLabel, formatValue } from "@/lib/uz";

export function Summary({
  data,
  className = "record-summary",
}: {
  data: Record<string, unknown>;
  className?: string;
}) {
  return (
    <dl className={className}>
      {Object.entries(data)
        .filter(
          ([key, value]) =>
            !key.endsWith("_id") &&
            !["id", "media_url", "sample_key"].includes(key) &&
            typeof value !== "object" &&
            value !== "" &&
            !!fieldLabel(key),
        )
        .map(([key, value]) => (
          <div key={key} data-field={key}>
            <dt>{fieldLabel(key)}</dt>
            <dd>
              {/phone/.test(key) && /^\+\d+$/.test(String(value)) ? (
                <a href={`tel:${value}`}>{String(value)}</a>
              ) : (
                formatValue(value, key)
              )}
            </dd>
          </div>
        ))}
    </dl>
  );
}

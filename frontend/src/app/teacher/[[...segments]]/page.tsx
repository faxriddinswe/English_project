import { Workspace } from "@/features/workspace/Workspace";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Ustoz kabineti",
  robots: { index: false, follow: false },
};
export default async function Teacher({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const p = await params;
  return <Workspace role="teacher" segments={p.segments ?? []} />;
}

import { Workspace } from "@/features/workspace/Workspace";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "O‘quvchi kabineti",
  robots: { index: false, follow: false },
};
export default async function Student({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const p = await params;
  return <Workspace role="student" segments={p.segments ?? []} />;
}

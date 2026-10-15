import { notFound } from "next/navigation";
import { currentUser } from "@/lib/session";
import { getEnvelope } from "@/lib/esign/server";
import { Editor } from "@/components/esign/Editor";
export default async function EnvelopePage({ params }: { params: Promise<{ id: string }> }) {
  const u = (await currentUser())!; const e = await getEnvelope((await params).id);
  if (!e || e.ownerId !== u.id) notFound();
  return <Editor initial={e} />;
}

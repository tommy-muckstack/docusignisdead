import { notFound, redirect } from "next/navigation";
import { currentUser, entryRedirect } from "@/lib/session";
import { getEnvelope } from "@/lib/esign/server";
import { Editor } from "@/components/esign/Editor";
export default async function EnvelopePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const u = await currentUser(); if (!u) redirect(entryRedirect(`/app/envelopes/${id}`)); const e = await getEnvelope(id);
  if (!e || e.ownerId !== u.id) notFound();
  return <Editor initial={e} />;
}

import { getDoc, mutateDoc } from "@/lib/store";
import { rid } from "./logic";
import { listEnvelopes, mutateEnvelope } from "./server";
export type Folder = { id: string; name: string };
export const listFolders = async (ownerId: string) => (await getDoc<Folder[]>("folders", ownerId)) ?? [];
export async function changeFolder(ownerId: string, input: { action?: string; id?: string; name?: string }) {
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 80) : "";
  if (!["create", "rename", "delete"].includes(input.action ?? "")) throw new Error("Choose a folder action");
  if (input.action !== "delete" && !name) throw new Error("Enter a folder name");
  const folders = await mutateDoc<Folder[]>("folders", ownerId, current => {
    const all = current ?? [];
    if (input.action !== "create" && !all.some(f => f.id === input.id)) throw new Error("Folder not found");
    if (input.action !== "delete" && all.some(f => f.name.toLowerCase() === name.toLowerCase() && f.id !== input.id)) throw new Error("A folder with that name already exists");
    if (input.action === "create") { if (all.length >= 100) throw new Error("Folder limit reached (100)"); return [...all, { id: rid("folder_"), name }]; }
    return input.action === "delete" ? all.filter(f => f.id !== input.id) : all.map(f => f.id === input.id ? { ...f, name } : f);
  });
  if (input.action === "delete") for (const e of await listEnvelopes(ownerId)) if (e.folderId === input.id) await mutateEnvelope(e.id, latest => { if (latest.folderId === input.id) delete latest.folderId; return latest; });
  return folders ?? [];
}

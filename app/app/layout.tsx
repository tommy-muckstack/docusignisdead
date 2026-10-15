import { redirect } from "next/navigation";
import { currentUser, entryRedirect } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { getAccount } from "@/lib/account";
import { shellCfg } from "@/components/shellCfg";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect(entryRedirect("/app"));
  const account = await getAccount(user.id);
  return <AppShell user={{ ...user, name: account.name || user.name }} cfg={shellCfg}>{children}</AppShell>;
}

import { redirect } from "next/navigation";
import { currentUser, entryRedirect } from "@/lib/session";
import { getAccount } from "@/lib/account";
import { firebaseClientConfig } from "@/lib/isdead-auth/config";
import { AccountPanel } from "@/components/AccountPanel";
export default async function Page() {
  const user = await currentUser(); if (!user) redirect(entryRedirect("/app/settings"));
  const account = await getAccount(user.id); account.name ||= user.name;
  return <AccountPanel initial={account} user={user} section="settings" config={firebaseClientConfig()} />;
}

import { AuthScreen } from "@/components/AuthScreen";
import { demoEnabled } from "@/lib/session";
import { BP } from "@/lib/basepath";
import { firebaseClientConfig, firebaseConfigured } from "@/lib/isdead-auth/config";
export const dynamic = "force-dynamic";
export const metadata = { title: "Try DocuSignIsDead for free" };
export default async function FreeTrial({ searchParams }: { searchParams: Promise<{ email?: string; country?: string }> }) {
  const { email, country } = await searchParams;
  return <AuthScreen signup config={firebaseConfigured() ? firebaseClientConfig() : null} demo={demoEnabled()} to={`${BP}/app`} initialEmail={typeof email === "string" ? email.slice(0, 254) : ""} country={country} />;
}

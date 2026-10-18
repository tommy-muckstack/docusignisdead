import "@/vendor/isdead-design/css/docusign.css";
import "@/vendor/isdead-design/css/components.css";
import "./globals.css";
import "./auth-screen.css";
import { BP } from "@/lib/basepath";
import { site } from "@/site.config";
import { Analytics } from "@/lib/analytics/posthog";
export const metadata = { title: `${site.name}: free, open-source e-signatures`, description: site.hero.subtitle, applicationName: "DocuSignIsDead", manifest: `${BP}/manifest.webmanifest` };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" data-ids-theme="docusign"><body className="ids-root"><Analytics />{children}</body></html>;
}

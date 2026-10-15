import "@/vendor/isdead-design/css/docusign.css";
import "@/vendor/isdead-design/css/components.css";
import "./globals.css";
import "./auth-screen.css";
import { site } from "@/site.config";
export const metadata = { title: `${site.name}: free, open-source ${site.replaces} alternative`, description: site.hero.subtitle };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" data-ids-theme="docusign"><body className="ids-root">{children}</body></html>;
}

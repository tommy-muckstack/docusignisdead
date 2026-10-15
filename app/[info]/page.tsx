import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader, MarketingFooter } from "@/components/MarketingChrome";
import { marketingPages } from "@/lib/marketing-pages";
export function generateStaticParams() { return Object.keys(marketingPages).map(info => ({ info })); }
export async function generateMetadata({ params }: { params: Promise<{ info: string }> }) { return { title: marketingPages[(await params).info]?.title ?? "Page not found" }; }
export default async function Info({ params }: { params: Promise<{ info: string }> }) {
  const { info } = await params;
  if (!Object.prototype.hasOwnProperty.call(marketingPages, info)) notFound();
  const page = marketingPages[info]!;
  return <><MarketingHeader /><main className="marketing-content"><h1>{page.title}</h1>{page.sections.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}<p><Link href="/free-trial">Get started</Link> · <a href="https://github.com/tommy-muckstack/docusignisdead">Project repository</a></p></main><MarketingFooter /></>;
}

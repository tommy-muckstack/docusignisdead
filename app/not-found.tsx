import Link from "next/link";
import { MarketingHeader, MarketingFooter } from "@/components/MarketingChrome";
export default function NotFound() {
  return <><MarketingHeader /><main className="marketing-content"><p>404</p><h1>Page not found</h1><p>The link may have changed, or this page may no longer be available.</p><p><Link className="ids-btn ids-btn--primary" href="/">Go to homepage</Link></p><h2>Need help finding an agreement?</h2><p><Link href="/login">Log in to access your documents</Link>, or ask the sender for a new signing link.</p><p><Link href="/support">Visit support</Link></p></main><MarketingFooter /></>;
}

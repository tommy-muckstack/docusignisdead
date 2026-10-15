import { PriceCompare } from "@/components/PriceCompare";
import { MarketingHeader, MarketingFooter } from "@/components/MarketingChrome";
export const metadata = { title: "DocuSignIsDead: how it compares" };
export default function Compare() { return <><MarketingHeader /><main className="marketing-content"><h1>Compare the cost of signing</h1><p>DocuSignIsDead is free, open-source software. The paid reference plans below are for comparison only. Hosting costs depend on your deployment.</p><PriceCompare /></main><MarketingFooter /></>; }

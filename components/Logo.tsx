import { site } from "@/site.config";
import { BP } from "@/lib/basepath";
export function Logo({ size = 28 }: { size?: number }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "var(--ids-font-display)", fontWeight: 700, fontSize: size * 0.72, letterSpacing: "var(--ids-type-tracking)" }}>
    <img src={`${BP}/brand/icon-192.png`} width={size} height={size} alt="" aria-hidden />
    {site.name}
  </span>;
}

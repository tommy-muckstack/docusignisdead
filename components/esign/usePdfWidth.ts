"use client";
import { useEffect, useRef, useState } from "react";
export function usePdfWidth(max: number) {
  const ref = useRef<HTMLElement>(null); const [width, setWidth] = useState(320);
  useEffect(() => { const el = ref.current; if (!el) return; const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width > 0) setWidth(Math.max(120, Math.min(max, Math.floor(entry.contentRect.width)))); }); observer.observe(el); return () => observer.disconnect(); }, [max]);
  return { ref, width };
}

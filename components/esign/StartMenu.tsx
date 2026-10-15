"use client";
import Link from "next/link";
export function StartMenu() { return <details className="start-menu"><summary className="ids-btn ids-btn--primary">Start</summary><div onClick={e => e.currentTarget.parentElement?.removeAttribute("open")}><Link href="/app?start=send">Send an envelope</Link><Link href="/app?start=sign">Sign a document</Link><Link href="/app/templates">Use a template</Link></div></details>; }

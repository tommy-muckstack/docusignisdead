import type { ShellCfg } from "@/components/AppShell";
export const shellCfg: ShellCfg = { mode: "top", vars: { "--accent": "#4c00ff", "--page": "#fff", "--top-h": "64px", "--r": "4px", "--top-ink": "#130032" } as Record<string, string>,
  items: [{ label: "Home", href: "/app", icon: "home" }, { label: "Agreements", href: "/app/envelopes", icon: "doc" }, { label: "Templates", href: "/app/templates", icon: "template" }, { label: "Reports", href: "/app/reports", icon: "chart" }, { label: "Contacts", href: "/app/contacts", icon: "users" }, { label: "Settings", href: "/app/settings", icon: "settings" }],
  right: [{ label: "Start", href: "/app?start=send", solid: true }] };

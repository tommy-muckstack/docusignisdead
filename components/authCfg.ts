import type { AuthCfg } from "@/components/AuthScreen";
export const authCfg: AuthCfg = { layout: "center", accent: "#4c00ff", ctaBg: "#4c00ff", radius: 4, ink: "#130032", muted: "#5f5a6e", top: { logo: true, right: undefined, cta: undefined },
  title: "Log in", signupTitle: "Start your free trial", emailLabel: "Email", emailFirst: true, providersAfter: true, ctaNext: "Next", cta: "Log in", signupCta: "Create account",
  providers: [{ id: "google", label: "Continue with Google", signupLabel: "Sign up with Google" }, { id: "sso", label: "Log in with SSO", signupLabel: "Sign up with SSO" }],
  switchText: ["New to DocuSign?", "Start a free trial"], signupSwitchText: ["Already have an account?", "Log in"] };

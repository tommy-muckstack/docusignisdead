import { SignFlow } from "@/components/esign/SignFlow";
export const metadata = { title: "Review and sign", robots: { index: false } };
export default async function SignPage({ params }: { params: Promise<{ token: string }> }) { return <SignFlow token={(await params).token} />; }

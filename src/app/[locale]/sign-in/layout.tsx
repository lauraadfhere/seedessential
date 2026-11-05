import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to seed — the agriculture marketplace for plants, farming equipment, expert consultations and farm planning.",
  robots: { index: false, follow: false },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-arial">{children}</div>;
}

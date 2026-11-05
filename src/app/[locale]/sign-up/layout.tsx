import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enroll / Sign up",
  description:
    "Create a seed account as a farmer, regular member, agricultural expert, or equipment merchant supplier.",
  robots: { index: false, follow: false },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-arial">{children}</div>;
}

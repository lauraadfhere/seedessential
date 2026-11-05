import Link from "next/link";

// Fallback for the rare case a request reaches Next.js without a locale
// segment at all (middleware normally redirects `/x` -> `/en/x`). The
// fully branded 404 lives at `src/app/[locale]/not-found.tsx`. This one is
// rendered inside the root layout, so it must not render its own <html>/<body>.
export default function RootNotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        textAlign: "center",
        padding: "2rem",
        background: "#000",
        color: "#fff",
      }}
    >
      <p style={{ letterSpacing: "0.2em", fontSize: "0.75rem", textTransform: "uppercase" }}>
        Error 404
      </p>
      <span aria-hidden="true" style={{ color: "#62a83d", fontSize: "9rem", lineHeight: 0.8 }}>☹</span>
      <h1 style={{ fontSize: "2.5rem", margin: 0 }}>Page not found</h1>
      <Link href="/en" style={{ color: "#fff", textDecoration: "underline" }}>
        Back to Tannelli
      </Link>
    </main>
  );
}

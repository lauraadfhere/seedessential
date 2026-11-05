import Image from "next/image";
import { Link } from "./locale-link";
import { cn } from "./ui";

/**
 * Expertseed brand mark — white artwork for dark surfaces
 * (header, footer, auth panels).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center", className)}>
      <Image
        src="/seed.png"
        alt="seed"
        width={280}
        height={64}
        priority
        className="h-10 w-auto object-contain sm:h-12"
      />
    </Link>
  );
}

"use client";

import { BagIcon } from "./icons";
import { cn } from "./ui";
import { useCart } from "./cart-provider";

interface CartLinkProps {
  className?: string;
  onClick?: () => void;
}

export function CartLink({ className, onClick }: CartLinkProps) {
  const { count } = useCart();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Cart, ${count} items`}
      className={cn("relative grid h-11 w-11 place-items-center rounded-full text-white/85 transition hover:bg-white/10", className)}
    >
      <BagIcon className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-white px-1 text-[9px] font-bold leading-4 text-[#40533d]">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
